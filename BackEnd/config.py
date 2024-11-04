# config.py

import os

class Config:
    SECRET_KEY = '1234'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:1234@localhost/capstone_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
