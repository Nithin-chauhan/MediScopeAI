import os
import sys

from sqlalchemy import text
from backend.database.database import engine

with engine.connect() as con:
    res = con.execute(text("SELECT id, name, email, role FROM users"))
    for row in res:
        print(row)
