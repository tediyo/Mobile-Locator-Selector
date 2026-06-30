export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Overview: undefined;
  Locator: { url?: string; keyword?: string; locatorType?: string; autoRun?: boolean } | undefined;
  Performance: undefined;
  History: undefined;
  Profile: undefined;
};
