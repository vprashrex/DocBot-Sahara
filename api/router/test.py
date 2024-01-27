import json
import redis

# Establish a connection to Redis
r = redis.StrictRedis(host="localhost", port=6379, db=0)

titleb = r.hget("aHDKs","title")
if titleb is not None:
    title = titleb.decode('utf-8')
    print(title)