# 视频探监系统

## 1. 克隆项目
```
git clone 
```

## React
node
```
# 下载二进制
https://nodejs.org/dist/v14.17.0/node-v14.17.0-linux-x64.tar.xz

tar xvf node-v14.17.0-linux-x64.tar.xz
cd node-v14.17.0-linux-x64/
ln -s /root/node-v14.17.0-linux-x64/bin/node /usr/bin/node
ln -s /root/node-v14.17.0-linux-x64/bin/npm /usr/bin/npm
ln -s /root/node-v14.17.0-linux-x64/bin/npx /usr/bin/npx

```

创建react程序

## 2. 后端安装配置
系统：CentOS Linux release 7.8.2003 (Core) 最小安装
> 通过cat /etc/redhat-release 查看操作系统的版本号

redis
1. 安装Redis
```
yum install redis
```
2. 配置`/etc/redis.conf`
```
bind 127.0.0.1
port 6379
daemonize yes
# 数据文件
dbfilename dump.rdb
# 数据文件目录
dir /var/lib/redis
# 日志文件
logfile /var/log/redis/redis-server.log
database 16
```
3. 操作
```
启动
sudo service redis start
# redis-server /etc/redis/redis.conf 指定加载的配置文件

停⽌
sudo service redis stop

重启 
sudo service redis restart

连接
redis-cli
```

MySQL
1. 安装
```
$ rpm -qa|grep mariadb
mariadb-libs-5.5.65-1.el7.x86_64
$ rpm -e --nodeps mariadb-libs-5.5.65-1.el7.x86_64
$ rpm -qa|grep mariadb
$ wget https://repo.mysql.com//mysql80-community-release-el7-3.noarch.rpm
$ rpm -ivh mysql80-community-release-el7-3.noarch.rpm
$ yum install -y mysql-server mysql mysql-devel 
```

2. 配置
$ vim /etc/my.cnf
```
port表示端口号，默认为3306

bind-address表示服务器绑定的ip，默认为127.0.0.1

datadir表示数据库保存路径，默认为/var/lib/mysql

log_error表示错误日志，默认为/var/log/mysql/error.log

character_set_server=utf8 init_connect='SET NAMES utf8'设置默认字符集
```

3. 操作
```
# 状态|启动|停止|重启|开机自启|关闭开机自启 服务
$ systemctl status mysqld 
$ systemctl start mysqld
$ systemctl stop mysqld 
$ systemctl restart mysqld
$ systemctl enable mysqld
$ systemctl disable mysqld
```

4. 连接
```
# 1. 查看第一次登录密码 
$ grep 'temporary password' /var/log/mysqld.log
... A temporary password is generated for root @localhost: hak3iSK6-N8h

# 2. 登录
mysql -uroot -phak3iSK6-N8h
# 4. 重设密码
ALTER USER USER() IDENTIFIED BY 'Password2_mysql';

# 退出
quit 或者 exit 或者 ctr + d 表示退出

# 帮助
mysql --help

# 登录
mysql -uroot -pPassword2_mysql

# 创建数据库
create database vist_db;
```

Nginx
1. 安装
```
yum install nginx
```

2. 配置
```

```

1. 准备Python3环境
```
# 安装python3.6.8
yum install python3 -y

# 配置镜像源
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# 更新pip, 虚拟环境
python3 -m pip install --upgrade pip wheel setuptools virtualenvwrapper

echo "export VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3  # 安装路径
export WORKON_HOME=$HOME/.virtualenvs  # 虚拟环境保存位置
source /usr/local/bin/virtualenvwrapper.sh  # 脚本" >> ~/.bashrc

# 执行
source ~/.bashrc

# 进入源码，配置虚拟环境
cd endpoint/
mkvirtualenv vist
workon vist
pip install -r requirements.txt

短信服务
https://help.aliyun.com/document_detail/112147.htm?spm=a2c4g.11186623.2.13.16802e84xLkZxZ#t149555.html
pip install aliyun-python-sdk-core-v3

对象存储 OSS
https://help.aliyun.com/document_detail/85288.html?spm=a2c4g.11174283.6.1139.4c447da2Lf6nZG
yum install python-devel
pip install oss2
										
人脸人体
https://help.aliyun.com/document_detail/145009.html?spm=a2c4g.11186623.6.566.637e1e0fQHqQuo
pip install aliyun-python-sdk-core
pip install aliyun-python-sdk-facebody
```



## 3. 启动
1. 启动服务，需要进入虚拟环境

* 启动HTTP服务
```
# 使用gunicorn
gunicorn --config=gunicorn_config.py --daemon manage:app

# 控制台
# python manage.py runserver
```

* 启动HTTPS, 需要配置证书
```
# 使用gunicorn
gunicorn --certfile=/root/workspace/vist/cert/server.pem --keyfile=/root/workspace/vist/cert/server.key --bind 0.0.0.0:443 --daemon manage:app

# 控制台
# 修改manage.py
# python manage.py runserver
```

## 4 停止服务
* 控制台运行使用`CTRL+C`

* gunicorn
```
# 查找进程
pstree -ap|grep gunicorn

# kill -9 进程号
```

## 生成私有证书

[自签名证书](https://www.jianshu.com/p/81dbcde4fd7c)
在`cert`文件夹下执行
```
openssl req -new -x509 -newkey rsa:2048 -keyout ./server.key -out ./server.crt
```