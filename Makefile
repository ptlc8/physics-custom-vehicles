ip=localhost

all : run

install :
	npm install

run :
	node server.js ${ip}
