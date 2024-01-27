import os
from ctransformers import AutoModelForCausalLM, AutoConfig
from dataclasses import dataclass,asdict

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
    stop: list

class ModelsPath:
    CODE_GEN_MODEL = os.path.abspath("./models/medical/Docbot-llama-tiny.gguf")


class CodeGen:
    MAX_LENGTH = 2048

    def __init__(self):
        self.model = None

    def format_prompt(self, user_prompt: str):

        prompt = f"""
        <|im_start|>user
        {user_prompt}<|im_end|>
        <|im_start|>assistant<|im_end|>
        """
        return prompt

    # GENERATE WORD WITH TIMEOUT_CONDITION
    def generate(self,llm: AutoModelForCausalLM,generation_config: GenerationConfig,user_prompt:str):
        return llm(
            self.format_prompt(user_prompt),
            **asdict(generation_config)
        )
    
    def initliaze_model(self):
        if self.model is None:
            config = AutoConfig.from_pretrained(os.path.abspath("./models/medical"),context_length=self.MAX_LENGTH)
            self.model = AutoModelForCausalLM.from_pretrained(
                ModelsPath.CODE_GEN_MODEL,
                model_type="tinyllama",
                config=config
            )

    def infer(self,user_prompt:str):
        self.initliaze_model()
        generation_config = GenerationConfig(
            temperature=0,
            top_k=50,
            top_p=0.9,
            repetition_penalty=1.0,
            max_new_tokens=100,  # adjust as needed
            seed=42,
            reset=False,  
            stream=True,  
            threads=int(os.cpu_count() / 6),
            stop=["</s>"],
        )
        gen_word = self.generate(self.model,generation_config,user_prompt.strip())

        return gen_word

    def __iter__(self):
        if not self.model:
            raise StopIteration
        else:
            for word in self.model:
                yield  word

if __name__ == '__main__':
    try:
        code_gen = CodeGen()
        gen_word = code_gen.infer("what is parkinson's disease?")
        for word in gen_word:
            print(word,end="",flush=True)
        print("")
    except Exception as e:
        print(e)