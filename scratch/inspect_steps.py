import json

def main():
    path = "/home/wavy/.gemini/antigravity-ide/brain/28247ddc-62ab-43d9-ac53-7cb54daa2875/.system_generated/logs/transcript.jsonl"
    with open(path) as f:
        for line in f:
            d = json.loads(line)
            idx = d.get("step_index")
            if idx is not None and 122 <= idx <= 128:
                print(f"=== STEP {idx} ===")
                print(json.dumps(d, indent=2))
                print()

if __name__ == "__main__":
    main()
