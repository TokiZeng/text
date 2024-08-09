import requests

url = 'http://125.228.97.125:5000/translate'
text_to_translate = "This is a test sentence."

response = requests.post(url, json={'text': text_to_translate})

if response.status_code == 200:
    translated_text = response.json().get('translated_text')
    print(f"Original: {text_to_translate}")
    print(f"Translated: {translated_text}")
else:
    print(f"Failed to get a response: {response.status_code}")
