import { expect, test } from "@playwright/test";

test("visitor can explore the complete demo flow", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find work that fits." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Try the demo" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Senior Product Designer" }),
  ).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Product Manager, Member Experience" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Saved" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved & interested" }),
  ).toBeVisible();
});

test("job detail labels fit as an estimate", async ({ page }) => {
  await page.goto("/jobs/demo-product-designer");
  await expect(page.getByText("Résumé fit", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/not a prediction of hiring success/i),
  ).toBeVisible();
});

test("job discovery stays usable at narrow mobile widths", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("tab", { name: /AI/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Software/i })).toBeVisible();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const documentWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth);

  await page.getByRole("tab", { name: /Software/i }).click();
  await expect(
    page.getByRole("heading", { name: "Frontend Engineer, Growth" }),
  ).toBeVisible();
  await page
    .getByLabel(
      "View details for Frontend Engineer, Growth at Beacon",
    )
    .click();
  await expect(page).toHaveURL(/\/jobs\/demo-frontend-engineer$/);
  await expect(page.getByText("About the role")).toBeVisible();
});
