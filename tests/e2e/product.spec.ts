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
