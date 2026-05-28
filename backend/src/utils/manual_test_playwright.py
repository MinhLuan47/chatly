import os
import sys
import time
import random
from playwright.sync_api import sync_playwright

def safe_print(text):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode('ascii', errors='replace').decode('ascii'))

def run_e2e_browser_test():
    safe_print("Starting automated manual UI test with Playwright...")
    
    rand_id = random.randint(1000, 9999)
    user_a = {
        "first_name": "Anh",
        "last_name": f"Nguyen{rand_id}",
        "username": f"user_a_{rand_id}",
        "email": f"a_{rand_id}@playwright.com",
        "password": "password123"
    }
    user_b = {
        "first_name": "Binh",
        "last_name": f"Tran{rand_id}",
        "username": f"user_b_{rand_id}",
        "email": f"b_{rand_id}@playwright.com",
        "password": "password123"
    }

    safe_print(f"User A: {user_a['username']}")
    safe_print(f"User B: {user_b['username']}")

    screenshot_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Context for User A
        context_a = browser.new_context(viewport={"width": 1280, "height": 800})
        page_a = context_a.new_page()
        
        # Context for User B
        context_b = browser.new_context(viewport={"width": 1280, "height": 800})
        page_b = context_b.new_page()

        # Print console logs safely
        page_a.on("console", lambda msg: safe_print(f"[Page A Console]: {msg.text}"))
        page_a.on("pageerror", lambda err: safe_print(f"[Page A Error]: {err}"))
        page_b.on("console", lambda msg: safe_print(f"[Page B Console]: {msg.text}"))
        page_b.on("pageerror", lambda err: safe_print(f"[Page B Error]: {err}"))

        try:
            # Step 1: Register User A
            safe_print("\n[Step 1] Registering User A...")
            page_a.goto("http://localhost:5173/signup")
            page_a.wait_for_selector("#firstName", timeout=10000)
            page_a.fill("#firstName", user_a["first_name"])
            page_a.fill("#lastName", user_a["last_name"])
            page_a.fill("#username", user_a["username"])
            page_a.fill("#email", user_a["email"])
            page_a.fill("#password", user_a["password"])
            page_a.click("button[type='submit']")
            
            # Wait for registration processing
            time.sleep(2)
            
            # Navigate to signin page to log in
            safe_print("Navigating User A to Sign In...")
            page_a.goto("http://localhost:5173/signin")
            page_a.wait_for_selector("#username", timeout=10000)
            page_a.fill("#username", user_a["username"])
            page_a.fill("#password", user_a["password"])
            page_a.click("button[type='submit']")
            
            # Wait for home page layout to load
            page_a.wait_for_url("http://localhost:5173/", timeout=10000)
            page_a.wait_for_selector("[data-sidebar='sidebar']", timeout=10000)
            safe_print("User A logged in successfully!")
            
            # Step 2: Register User B
            safe_print("\n[Step 2] Registering User B...")
            page_b.goto("http://localhost:5173/signup")
            page_b.wait_for_selector("#firstName", timeout=10000)
            page_b.fill("#firstName", user_b["first_name"])
            page_b.fill("#lastName", user_b["last_name"])
            page_b.fill("#username", user_b["username"])
            page_b.fill("#email", user_b["email"])
            page_b.fill("#password", user_b["password"])
            page_b.click("button[type='submit']")
            
            time.sleep(2)
            
            safe_print("Navigating User B to Sign In...")
            page_b.goto("http://localhost:5173/signin")
            page_b.wait_for_selector("#username", timeout=10000)
            page_b.fill("#username", user_b["username"])
            page_b.fill("#password", user_b["password"])
            page_b.click("button[type='submit']")
            
            page_b.wait_for_url("http://localhost:5173/", timeout=10000)
            page_b.wait_for_selector("[data-sidebar='sidebar']", timeout=10000)
            safe_print("User B logged in successfully!")

            # Step 3: User A sends friend request to User B
            safe_print("\n[Step 3] User A sends a friend request to User B...")
            # Click Add Friend trigger button (UserPlus icon)
            page_a.click(".lucide-user-plus, button:has(.lucide-user-plus)")
            page_a.wait_for_selector("text=Kết bạn", timeout=5000)
            
            page_a.fill("input[placeholder='Gõ tên username vào đây...']", user_b["username"])
            page_a.click("form button[type='submit']")
            
            page_a.wait_for_selector("text=Tìm thấy", timeout=5000)
            page_a.fill("textarea[placeholder*='Có thể kết bạn']", "Chào Binh! Kết bạn nhé.")
            page_a.click("form button[type='submit']")
            
            time.sleep(2)
            safe_print("Friend request sent!")

            # Step 4: User B accepts friend request
            safe_print("\n[Step 4] User B accepts User A's friend request...")
            # Open user dropdown menu
            page_b.click("[data-sidebar='footer'] button, .lucide-chevrons-up-down, button:has(.lucide-chevrons-up-down)")
            # Wait for dropdown item "Thông báo"
            page_b.wait_for_selector("text=Thông báo", timeout=5000)
            page_b.click("text=Thông báo")
            
            # Wait for accept button directly to avoid Unicode normalized title matching
            page_b.wait_for_selector("button:has-text('Chấp nhận')", timeout=5000)
            
            # Click accept (Chấp nhận)
            page_b.click("button:has-text('Chấp nhận')")
            
            time.sleep(2)
            page_b.keyboard.press("Escape")
            safe_print("Friend request accepted!")

            # Step 5: Start chat
            safe_print("\n[Step 5] Direct Message exchange...")
            # Let stores fetch lists
            page_a.reload()
            page_b.reload()
            
            page_a.wait_for_selector("[data-sidebar='sidebar']", timeout=10000)
            page_b.wait_for_selector("[data-sidebar='sidebar']", timeout=10000)
            
            page_a.click(f"text={user_b['last_name']} {user_b['first_name']}")
            page_a.wait_for_selector("input[placeholder='Nhập tin nhắn...']", timeout=5000)
            
            msg_text = "Xin chào! Đây là tin nhắn real-time được gửi tự động từ Playwright."
            page_a.fill("input[placeholder='Nhập tin nhắn...']", msg_text)
            page_a.press("input[placeholder='Nhập tin nhắn...']", "Enter")
            safe_print("User A sent message.")
            
            page_b.click(f"text={user_a['last_name']} {user_a['first_name']}")
            page_b.wait_for_selector(f"text={msg_text}", timeout=5000)
            safe_print("User B received message in real-time!")
            
            reply_text = "Chào Anh! Mình đã nhận được tin nhắn real-time thành công nhé!"
            page_b.fill("input[placeholder='Nhập tin nhắn...']", reply_text)
            page_b.press("input[placeholder='Nhập tin nhắn...']", "Enter")
            safe_print("User B sent reply.")
            
            page_a.wait_for_selector(f"text={reply_text}", timeout=5000)
            safe_print("User A received reply in real-time!")
            
            # Capture final screenshots
            path_a = os.path.join(screenshot_dir, "user_a_chat.png")
            path_b = os.path.join(screenshot_dir, "user_b_chat.png")
            page_a.screenshot(path=path_a)
            page_b.screenshot(path=path_b)
            
            safe_print("\nSuccessful E2E Real-time chat integration test!")
            safe_print(f"Screenshot User A saved to: {path_a}")
            safe_print(f"Screenshot User B saved to: {path_b}")

        except Exception as err:
            safe_print(f"\n[ERROR OCCURRED]: {err}")
            fail_path_a = os.path.join(screenshot_dir, "error_user_a.png")
            fail_path_b = os.path.join(screenshot_dir, "error_user_b.png")
            try:
                page_a.screenshot(path=fail_path_a)
                page_b.screenshot(path=fail_path_b)
                safe_print(f"Saved error screenshots to:\n  A: {fail_path_a}\n  B: {fail_path_b}")
            except Exception as ss_err:
                safe_print(f"Failed to capture error screenshots: {ss_err}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_e2e_browser_test()
