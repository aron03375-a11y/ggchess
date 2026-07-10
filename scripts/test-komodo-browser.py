import asyncio
import re

from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        console_lines = []
        page.on("console", lambda msg: console_lines.append(f"{msg.type}: {msg.text}"))

        await page.goto("http://localhost:8080", wait_until="domcontentloaded")
        await page.get_by_role("button", name=re.compile("Komodo", re.I)).click()
        await page.get_by_role("button", name="PLAY", exact=True).click()

        board = page.locator(".inline-grid.grid-cols-8").nth(0)
        box = await board.bounding_box()
        if not box:
            raise AssertionError("Chess board not found")

        def center(square):
            file_index = "abcdefgh".index(square[0])
            rank_index = 8 - int(square[1])
            return (
                box["x"] + (file_index + 0.5) * box["width"] / 8,
                box["y"] + (rank_index + 0.5) * box["height"] / 8,
            )

        for square in ("e2", "e4"):
            x, y = center(square)
            await page.mouse.click(x, y)
            await page.wait_for_timeout(150)

        for _ in range(60):
            if "Bot played:" in "\n".join(console_lines):
                break
            await page.wait_for_timeout(250)
        else:
            raise AssertionError("Komodo did not return and apply a move")

        body_text = await page.locator("body").inner_text()
        assert "e4" in body_text, "Player move was not recorded"
        assert "Bot played:" in "\n".join(console_lines), "Komodo did not return and apply a move"
        assert "setoption name UCI LimitStrength value true" in "\n".join(console_lines)
        assert "setoption name UCI Elo value" in "\n".join(console_lines)

        await browser.close()


asyncio.run(main())