import json

def main():
    path = "/home/wavy/.gemini/antigravity-ide/brain/28247ddc-62ab-43d9-ac53-7cb54daa2875/.system_generated/logs/transcript.jsonl"
    with open(path) as f:
        for line in f:
            d = json.loads(line)
            idx = d.get("step_index")
            if idx is not None and 70 <= idx <= 76:
                print(f"=== STEP {idx} ===")
                print(f"Source: {d.get('source')}")
                print(f"Type: {d.get('type')}")
                content = d.get('content') or ""
                print(f"Content length: {len(content)}")
                print(f"Content: {content[:500]}...")
                print()

if __name__ == "__main__":
    main()
