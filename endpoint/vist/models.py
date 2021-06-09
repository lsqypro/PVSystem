# -*- coding:utf-8 -*-

from datetime import datetime
from vist import db
from werkzeug.security import generate_password_hash, check_password_hash
import time

class BaseModel(object):
    """模型基类，为每个模型补充创建时间与更新时间"""

    create_time = db.Column(db.DateTime, default=datetime.now)  # 记录的创建时间
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)  # 记录的更新时间


class User(BaseModel, db.Model):
    """用户表"""

    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 用户类型
    user_type = db.Column(db.Enum("家属", "服刑人员", "监狱管理员", "系统管理员"), default="家属")
    
    # 真实姓名
    real_name = db.Column(db.String(20), default='未实名')
    
    # 身份证号码
    id_card = db.Column(db.String(18))

    # 实名状态
    real_status = db.Column(db.Enum("未实名", "已实名", "实名中"), default='未实名')

    # 电话号码
    mobile = db.Column(db.String(32), nullable=False, unique=True)

    # 密码hash处理
    password_hash = db.Column(db.String(128), nullable=False)
    
    # 头像URL
    avatar_url = db.Column(db.String(128))
    
    # 身份证正面URL
    id_card_url_front = db.Column(db.String(128))

    # 身份证反面URL
    id_card_url_back = db.Column(db.String(128))

    # 不可直接获取密码
    @property
    def password(self):
        raise AttributeError("不可读属性")

    # 明文设置密码
    @password.setter
    def passord(self, value):
        self.password_hash = generate_password_hash(value)

    # 密码校验
    def check_password(self, passord):
        return check_password_hash(self.password_hash, passord)

    # 用户信息
    def get_dict(self):
        return {
            "id": self.id,
            "user_type": self.user_type,
            "real_name": self.real_name,
            "id_card": self.id_card,
            "real_status": self.real_status,
            "mobile": self.mobile,
            "avatar_url": self.avatar_url,
            "id_card_url_front": self.id_card_url_front,
            "id_card_url_back": self.id_card_url_back,
        }


class AuthorRecord(BaseModel, db.Model):
    """实名认证申请记录表"""
    
    __tablename__ = "author_record"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 实名认证申请状态
    status = db.Column(db.Enum("已提交", "未通过", "已通过"), default='已提交')

    # 用户ID
    user_id = db.Column(db.Integer)

    # 真实姓名
    real_name = db.Column(db.String(20))
    
    # 身份证号码
    id_card = db.Column(db.String(18))

    # 身份证正面URL
    id_card_url_front = db.Column(db.String(128))

    # 身份证反面URL
    id_card_url_back = db.Column(db.String(128))

    def get_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "user_id": self.user_id,
            "real_name": self.real_name,
            "id_card": self.id_card,
            "id_card_url_front": self.id_card_url_front,
            "id_card_url_back_desc": self.id_card_url_back
        }


class VistRecord(BaseModel, db.Model):
    """探监记录表"""

    __tablename__ = "vist_record"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 家属ID
    relation_id = db.Column(db.Integer)

    # 服刑人员ID
    prisoner_id = db.Column(db.Integer)
    
    # user_a_obj = db.relationship("User", backref="record")
    # user_b_obj = db.relationship("User", backref="record")

    # 探监状态
    status = db.Column(db.Enum('审核中', '已通过', '未通过', '已结束'), default="审核中")

    # 开始时间
    start_time = db.Column(db.DateTime)

    # 结束时间
    end_time = db.Column(db.DateTime)

    # 申请描述
    apply_desc = db.Column(db.String(128))

    # 实际通话时间 (分钟)
    real_chat_time = db.Column(db.Integer)

    # 房间号
    room_id = db.Column(db.String(128))

    @property
    def start(self):
        return self.start_time.strftime("%Y-%m-%d %H:%M:%S")

    @property
    def end(self):
        return self.end_time.strftime("%Y-%m-%d %H:%M:%S")

    def get_dict(self):
        return {
            "id": self.id,
            "relative_id": self.relation_id,
            "prisoner_id": self.prisoner_id,
            "status": self.status,
            "start_time": self.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": self.end_time.strftime("%Y-%m-%d %H:%M:%S"),
            "apply_desc": self.apply_desc,
            "real_chat_time": self.real_chat_time,
            "current_time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "create_time": self.create_time.strftime("%Y-%m-%d %H:%M:%S"),
            "update_time": self.update_time.strftime("%Y-%m-%d %H:%M:%S"),
            "room_id": self.room_id
        }