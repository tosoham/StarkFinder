import requests

url = "https://api.brianknows.org/api/v0/agent/knowledge"
headers = {
    "Content-Type": "application/json",
    "x-brian-api-key": "brian_p6b2MkYZt45MBakIF"
}

ta
data = {
    "prompt": "What is Uniswap?"
}

# Send a POST request
response = requests.post(url, headers=headers, json=data)

# Check and print the response
if response.status_code == 200:
    print("Response:", response.json())
else:
    print(f"Failed to get response. Status code: {response.status_code}")
    print("Response:", response.text)
