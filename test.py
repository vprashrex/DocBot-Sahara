from api.pipeline import medical_api

model = medical_api.CodeGen()

gen_word = model.infer("Hello World")

for word in gen_word:
    print(word,end="",flush=True)
