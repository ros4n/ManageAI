from openai import AzureOpenAI
import os

# Configuration
endpoint = "https://nexalaris-tech.openai.azure.com/openai/deployments/gpt-5.4/chat/completions?api-version=2024-10-21"   # base endpoint only
api_key = "By75sYyrPgd7pqOjMaXPmQGHoGyUqdGEegzF3QSIaImpr6T1zF6JJQQJ99CCACfhMk5XJ3w3AAAAACOGzx69"

# Create client
client = AzureOpenAI(
    api_key=api_key,
    api_version="2024-10-21",
    azure_endpoint=endpoint
)

# Send prompt
response = client.chat.completions.create(
    model="gpt-5.4",   # must be your Azure deployment name
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain what AI is in simple terms."}
    ]
)

print(response.choices[0].message.content)