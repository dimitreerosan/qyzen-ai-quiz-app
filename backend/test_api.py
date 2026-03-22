import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    username = f"testuser_{uuid.uuid4().hex[:6]}"
    password = "123456password"
    
    print(f"--- 1. REGISTER: {username} ---")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "password": password
    })
    print("Status:", reg_res.status_code)
    try:
        print("Response:", reg_res.json())
    except:
        print("Response Text:", reg_res.text)
    
    # Check if there is a slash difference
    if reg_res.status_code == 404:
        reg_res = requests.post(f"{BASE_URL}/auth/register/", json={
            "username": username,
            "password": password
        })
        print("Status (with trailing slash):", reg_res.status_code)
        try:
            print("Response:", reg_res.json())
        except:
            print("Response Text:", reg_res.text)
            
    # Try logging in
    
    print(f"\n--- 2. LOGIN: {username} ---")
    login_res = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": username,
        "password": password
    })
    # Fallback to without slash if 404 and we handled slash above differently? 
    if login_res.status_code == 404:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": password
        })

    print("Status:", login_res.status_code)
    try:
        data = login_res.json()
        print("Response:", data)
    except:
        print("Response Text:", login_res.text)
        return
        
    token = data.get("access") or data.get("token") or data.get("access_token")
    if not token and "tokens" in data:
        token = data["tokens"].get("access")
        
    if not token:
        print("FAILED TO GET TOKEN")
        return
        
    print(f"\n--- 3. GENERATE QUIZ ---")
    headers = {"Authorization": f"Bearer {token}"}
    quiz_res = requests.post(f"{BASE_URL}/quiz/generate/", headers=headers, json={
        "topic": "Python",
        "number_of_questions": 5,
        "difficulty": "easy"
    })
    
    if quiz_res.status_code == 404:
        quiz_res = requests.post(f"{BASE_URL}/quiz/generate", headers=headers, json={
            "topic": "Python",
            "number_of_questions": 5,
            "difficulty": "easy"
        })
        
    print("Status:", quiz_res.status_code)
    try:
        print("Response:", json.dumps(quiz_res.json(), indent=2))
    except:
        print("Response Text:", quiz_res.text)

if __name__ == "__main__":
    test_flow()
