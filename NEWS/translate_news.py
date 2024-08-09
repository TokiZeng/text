from flask import Flask, request, jsonify
from transformers import MarianMTModel, MarianTokenizer
import opencc

app = Flask(__name__)

# 加載模型和分詞器
model_name = 'Helsinki-NLP/opus-mt-en-zh'
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

# 加載 opencc 轉換器，使用內置的簡體到繁體轉換配置
converter = opencc.OpenCC('s2t')  # 使用內置的簡體到繁體轉換配置

def translate(text):
    inputs = tokenizer.encode(text, return_tensors="pt", max_length=512, truncation=True)
    translated = model.generate(inputs, max_length=512)
    translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
    translated_text_traditional = converter.convert(translated_text)  # 轉換為繁體中文
    return translated_text_traditional

@app.route('/translate', methods=['POST'])
def translate_endpoint():
    data = request.get_json()
    text = data.get('text', '')
    translated_text = translate(text)
    return jsonify({'translated_text': translated_text})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
