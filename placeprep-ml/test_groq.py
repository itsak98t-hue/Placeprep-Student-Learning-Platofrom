import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print("Groq key loaded:", "FOUND" if api_key else "NOT FOUND")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1",
)

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {
            "role": "user",
            "content": "Reply with exactly this JSON: {\"status\":\"ok\",\"source\":\"groq\"}"
        }
    ],
    temperature=0,
)

print(response.choices[0].message.content)