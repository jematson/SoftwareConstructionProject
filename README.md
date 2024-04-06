---Bine installation---

In order to install and run Bine on your device, you must have MongoDB installed. Go to https://www.mongodb.com/docs/manual/installation/#mongodb-installation-tutorials to do this. It is a free and safe software.


Next, do the following:

1) Follow the steps at https://www.mongodb.com/docs/mongodb-shell/install/#procedure to install mongosh.
2) Run mongosh and run the following commands:
	1) use BineData
	2) db.createCollection("users")
	3) db.createCollection("videos")
3) Navigate to the folder SoftwareConstructionProject/Project2 and run the command "node myServer.js" (sans the quotation marks)

This will boot up Bine on your local host. Open the web browser of your choice and navigate to localhost:10000. Here you should be presented with an operational Bine.
