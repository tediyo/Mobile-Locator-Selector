export type Framework = 'playwright' | 'cypress' | 'selenium';

export const LOCATOR_TYPES = [
  { value: 'xpath', label: 'XPath' },
  { value: 'full_xpath', label: 'Full XPath' },
  { value: 'selector', label: 'Selector' },
  { value: 'js_path', label: 'JS Path' },
  { value: 'outerhtml', label: 'OuterHTML' },
  { value: 'element', label: 'Element' },
  { value: 'styles', label: 'Styles' },
] as const;

export function generateSnippet(
  locatorType: string,
  locator: string,
  framework: Framework,
  tag: string,
): string {
  const escaped = locator.replace(/`/g, '\\`').replace(/\\/g, '\\\\');

  if (framework === 'playwright') {
    if (locatorType === 'xpath' || locatorType === 'full_xpath') {
      return `// Playwright – XPath\nconst el = page.locator('xpath=${escaped}');\nawait el.click();`;
    }
    if (locatorType === 'selector') {
      return `// Playwright – CSS Selector\nconst el = page.locator('${escaped}');\nawait el.click();`;
    }
    if (locatorType === 'js_path') {
      return `// Playwright – JS Path\nconst el = await page.evaluateHandle(() => ${escaped});`;
    }
    return `// Playwright – ${tag}\nconst el = page.locator('${escaped}');\nawait el.waitFor();`;
  }

  if (framework === 'cypress') {
    if (locatorType === 'xpath' || locatorType === 'full_xpath') {
      return `// Cypress – XPath\ncy.xpath('${escaped}').click();`;
    }
    if (locatorType === 'selector') {
      return `// Cypress – CSS Selector\ncy.get('${escaped}').click();`;
    }
    if (locatorType === 'js_path') {
      return `// Cypress – JS Path\ncy.window().then(win => { const el = ${escaped}; cy.wrap(el).click(); });`;
    }
    return `// Cypress – ${tag}\ncy.get('${escaped}').should('be.visible');`;
  }

  if (locatorType === 'xpath' || locatorType === 'full_xpath') {
    return `# Selenium – XPath\nfrom selenium.webdriver.common.by import By\nel = driver.find_element(By.XPATH, '${escaped}')\nel.click()`;
  }
  if (locatorType === 'selector') {
    return `# Selenium – CSS Selector\nfrom selenium.webdriver.common.by import By\nel = driver.find_element(By.CSS_SELECTOR, '${escaped}')\nel.click()`;
  }
  if (locatorType === 'js_path') {
    return `# Selenium – JS Path\nel = driver.execute_script('return ${escaped}')`;
  }
  return `# Selenium – ${tag}\nfrom selenium.webdriver.common.by import By\nel = driver.find_element(By.XPATH, '${escaped}')`;
}
