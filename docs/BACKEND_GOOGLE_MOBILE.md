# Backend: Google OAuth redirect for mobile app

The mobile app cannot complete Google sign-in until the API redirects to the app deep link after Google OAuth.

## Required redirect (after `/auth/google/callback`)

```
twt-locator://auth/callback?access_token=JWT&id=USER_ID&email=user@example.com&picture=https://lh3.googleusercontent.com/...
```

Include Google's `picture` URL from the OAuth profile (same field stored on the user and returned from `GET /users/me` as `picture` or `profilePicture`).

Same JWT as `POST /auth/login` (`access_token` field).

## Mobile app already sends

```
GET /auth/google?redirect_uri=twt-locator://auth/callback&platform=mobile&mobile=true
```

Store `redirect_uri` (or `platform=mobile`) in session/state when starting OAuth, then use it in the Google callback handler.

## Express + Passport example

```javascript
// GET /auth/google
app.get('/auth/google', (req, res, next) => {
  const redirectUri = req.query.redirect_uri || req.query.return_to;
  const isMobile =
    req.query.platform === 'mobile' ||
    req.query.mobile === 'true' ||
    (typeof redirectUri === 'string' && redirectUri.startsWith('twt-locator://'));

  req.session.oauthReturnTo = isMobile
    ? redirectUri || 'twt-locator://auth/callback'
    : process.env.WEB_APP_URL || 'https://your-web-app.com';

  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /auth/google/callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user;
    const accessToken = signJwt(user); // same as email login
    const returnTo = req.session.oauthReturnTo || process.env.WEB_APP_URL;

    if (returnTo.startsWith('twt-locator://')) {
      const q = new URLSearchParams({
        access_token: accessToken,
        id: String(user.id),
        email: user.email,
      });
      if (user.picture || user.profilePicture) {
        q.set('picture', user.picture || user.profilePicture);
      }
      return res.redirect(`${returnTo}?${q.toString()}`);
    }

    // Web (existing behavior)
    res.redirect(`${returnTo}/dashboard?token=${accessToken}`);
  },
);
```

## NestJS (concept)

1. In `GoogleAuthGuard` / controller `googleAuth()`, read `redirect_uri` from query and save to session or signed `state`.
2. In `googleAuthRedirect()`, if return URL starts with `twt-locator://`, `res.redirect()` with query params above.

## Google Cloud Console

Do **not** add `twt-locator://` to Google OAuth redirect URIs. Google still redirects to:

`https://twt-pktm.onrender.com/auth/google/callback`

Your server performs the second redirect to `twt-locator://...`.

## Deploy

After deploying backend changes to Render, test on device:

1. Tap **Continue with Google**
2. Complete Google login
3. App should reopen automatically with all bottom tabs (Overview, Locator, History, Profile)
