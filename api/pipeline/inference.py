import os
from dataclasses import dataclass, asdict
from ctransformers import AutoModelForCausalLM, AutoConfig


@dataclass
class GenerationConfig:
    temperature: float
    top_k: int
    top_p: float
    repetition_penalty: float
    max_new_tokens: int
    seed: int
    reset: bool
    stream: bool
    threads: int
    stop: list[str]

def format_prompt(user_prompt: str):
    
    return f"<|user|>\n{user_prompt}</s>\n<|assistant|>".strip()

''' def format_prompt(user_prompt: str):
    return f"""
    <human>:{user_prompt}
    <assistant>:
    """.strip() '''


def generate(
    llm: AutoModelForCausalLM,
    generation_config: GenerationConfig,
    user_prompt: str,
):
    """run model inference, will return a Generator if streaming is true"""

    return llm(
        format_prompt(
            user_prompt,
        ),
        **asdict(generation_config),
    )


if __name__ == "__main__":
    config = AutoConfig.from_pretrained(
        os.path.abspath("./models/medical"),
        context_length=2048,
    )
    llm = AutoModelForCausalLM.from_pretrained(
        os.path.abspath("./models/medical/Docbot-llama-tiny.gguf"),
        model_type="tinyllama",
        config=config,
    )

    generation_config = GenerationConfig(
        temperature=0,
        top_k=50,
        top_p=0.9,
        repetition_penalty=1.0,
        max_new_tokens=150,  
        seed=42,
        reset=True, 
        stream=True,
        threads=int(os.cpu_count() / 6),
        stop=["<|endoftext|>"],
    )

    user_prefix = "[user]: "
    assistant_prefix = f"[assistant]:"

    while True:
        user_prompt = input(user_prefix)
        generator = generate(llm, generation_config, user_prompt.strip())
        print(assistant_prefix, end=" ", flush=True)
        for word in generator:
            print(word, end="", flush=True)
        print("")