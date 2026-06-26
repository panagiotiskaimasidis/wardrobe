import { test, expect, type Page } from "@playwright/test";

/**
 * The three critical flows from the brief:
 *  1. Clip/add an item to the catalog.
 *  2. Build a board via drag-and-drop.
 *  3. Follow someone and see their activity in the feed.
 */

async function devLogin(page: Page, name: string) {
  await page.goto("/login");
  await page.getByText(name, { exact: true }).click();
  await page.waitForURL("**/collections");
}

test("Flow 1: add an item to the catalog (manual entry fallback)", async ({
  page,
}) => {
  await devLogin(page, "Ava Stone");

  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Use the manual-entry fallback so the test never depends on outbound network.
  await page.getByText("or enter an item manually").click();

  const title = `E2E Test Jacket ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Brand").fill("E2E Brand");
  await page.getByRole("button", { name: "Add to catalog" }).click();

  // Toast confirms the save.
  await expect(page.getByText("Added to your catalog")).toBeVisible();

  // The new item is findable in the catalog.
  await page.goto(`/catalog?q=${encodeURIComponent("E2E Test Jacket")}`);
  await expect(page.getByText(title).first()).toBeVisible();
});

test("Flow 2: build a board with drag-and-drop", async ({ page }) => {
  await devLogin(page, "Ava Stone");

  // Open the first closet.
  await page.locator('a[href^="/collections/"]').first().click();
  await page.waitForURL(/\/collections\/[^/]+$/);

  // Wait for the catalog drag-source panel.
  const source = page
    .locator('[aria-label^="Drag "][aria-label$=" onto the board"]')
    .first();
  await source.waitFor({ state: "visible" });

  const before = await page.locator('[aria-label^="Remove "]').count();

  // Drag the first catalog item onto the board.
  const box = (await source.boundingBox())!;
  const target = page.locator('[aria-label^="Remove "]').first();
  const tbox = (await target.boundingBox()) ?? {
    x: 300,
    y: 300,
    width: 40,
    height: 40,
  };

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2, {
    steps: 6,
  });
  await page.mouse.move(tbox.x + tbox.width / 2, tbox.y + tbox.height / 2, {
    steps: 15,
  });
  await page.mouse.up();

  await expect
    .poll(async () => page.locator('[aria-label^="Remove "]').count(), {
      timeout: 5000,
    })
    .toBeGreaterThan(before);
});

test("Flow 3: follow someone and see them in the feed", async ({ page }) => {
  // Sign up a fresh account so the feed starts empty.
  const stamp = Date.now();
  const handle = `e2e${stamp}`.slice(0, 18);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Email").fill(`${handle}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/collections");

  // Empty feed initially.
  await page.goto("/feed");
  await expect(page.getByText("Your feed is quiet")).toBeVisible();

  // Follow a seeded demo user.
  await page.goto("/u/ava");
  await page.getByRole("button", { name: /Follow @ava/ }).click();
  await expect(
    page.getByRole("button", { name: /Unfollow @ava/ }),
  ).toBeVisible();

  // Their activity now shows in the feed.
  await page.goto("/feed");
  await expect(page.getByText("Ava Stone").first()).toBeVisible();
});
