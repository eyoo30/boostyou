CREATE TABLE Users (
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	username VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL
);

-- Id, rank, name, region, description, price

CREATE TABLE Listings (
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	username VARCHAR(255) REFERENCES Users(username),
	rank VARCHAR(255),
	region VARCHAR(5),
	description TEXT,
	price int,
	stock int
);

CREATE TABLE Transactions (
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	listingId int REFERENCES Listings(id),
	userId int REFERENCES Users(id),
	Time date,
	stock INT
);

INSERT INTO Transactions (listingId, userId, time, stock)
VALUES(1, 1, datetime('now', 'localtime'), 1);