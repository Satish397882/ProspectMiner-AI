from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True)
    company_name = Column(String)
    website = Column(String)
    email = Column(String)
    description = Column(Text)
