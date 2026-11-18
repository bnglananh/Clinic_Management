import os
from typing import Optional


class DbVerifier:
    """
    Helper kết nối trực tiếp tới 4 CSDL NoSQL (MongoDB, Redis, Cassandra, Neo4j)
    để xác minh trạng thái dữ liệu tầng DB cho các test case `API+DB` và `DB`.
    Nếu driver chưa cài hoặc đang chạy Memory mode, trả về None để test bỏ qua (skip) kiểm tra DB.
    """

    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.mongo_db_name = os.getenv("MONGO_DB", "clinic_db")
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_pass = os.getenv("NEO4J_PASSWORD", "clinic123")
        self.cassandra_host = os.getenv("CASSANDRA_HOST", "localhost")
        self.cassandra_keyspace = os.getenv("CASSANDRA_KEYSPACE", "clinic_keyspace")

    def get_mongo_db(self):
        try:
            from pymongo import MongoClient
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=1500)
            client.admin.command("ping")
            return client[self.mongo_db_name]
        except Exception:
            return None

    def get_redis(self):
        try:
            import redis
            r = redis.Redis(host=self.redis_host, port=self.redis_port, decode_responses=True, socket_connect_timeout=1.5)
            r.ping()
            return r
        except Exception:
            return None

    def get_neo4j(self):
        try:
            from neo4j import GraphDatabase
            driver = GraphDatabase.driver(self.neo4j_uri, auth=(self.neo4j_user, self.neo4j_pass))
            driver.verify_connectivity()
            return driver
        except Exception:
            return None

    def get_cassandra(self):
        try:
            from cassandra.cluster import Cluster
            cluster = Cluster([self.cassandra_host], connect_timeout=2)
            return cluster.connect(self.cassandra_keyspace)
        except Exception:
            return None
