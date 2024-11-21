import json
import uuid
import os

# 讀取現有的 tokens.json 檔案
def read_tokens():
    if os.path.exists('tokens.json'):
        with open('tokens.json', 'r') as file:
            return json.load(file)
    return {"users": []}  # 如果檔案不存在，返回空的用戶數組

# 寫入新的 tokens.json 檔案
def write_tokens(tokens):
    with open('tokens.json', 'w') as file:
        json.dump(tokens, file, indent=2)

# 生成新的 token 並記錄到 tokens.json
def generate_token(username):
    tokens = read_tokens()

    # 檢查用戶名是否已存在
    for user in tokens['users']:
        if user['username'] == username:
            print(f'Username already exists. Existing token for {username}: {user["token"]}')
            return

    # 如果用戶名不重複，生成新的 token
    new_token = str(uuid.uuid4())  # 生成新的 token
    tokens['users'].append({'username': username, 'token': new_token})
    write_tokens(tokens)
    print(f'Generated token for {username}: {new_token}')

# 讀取用戶輸入
if __name__ == "__main__":
    username = input('Enter username: ')
    generate_token(username)
