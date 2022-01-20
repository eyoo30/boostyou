# BoostYou api documentation

## See listings
**Request Format:** /listings/:id

**Query Parameters:** id (optional)

**Request Type (both requests):** Get

**Returned Data Format:** JSON

**Description 1:** If no parameters are given, then it will return an object with key "listings"
and value of all the possible listings

**Example Request 1:** /listings

**Example Output 1**
{
  "listings": [
    {
      "id": 1,
      "username": "test1",
      "price": 9.99,
      "region": "NA",
      "description": "asdf"
    },
    {
      "id": 2,
      "username": "test2",
      "price": 11.99,
      "region": "EU",
      "description": "asdf"
    },
    {
      "id": 3,
      "username": "test3",
      "price": 12.99,
      "region": "KR",
      "description": "asdf"
    }
  ]
}

**Description 2** If parameters are given, then it will return an object with key "listings" and
the value will be the listing with the given id

**Example request 2** /listings/1

**Example output 2**
{
  "listings": [
    {
      "id": 1,
      "username": "test1",
      "price": 9.99,
      "region": "NA",
      "description": "asdf"
    }
  ]
}

**Error handling**
- error 400, if listing id does not match any listing

## See if user login is valid
**Request Format:** /user/login

**Query Parameters:** username (required), password (required)

**Request Type (both requests):** POST

**Returned Data Format:** JSON

**Description:** If username and password are included, it will search to see if it is a valid login.
If it is, then it will return an object with a key "isValid" and a boolean of whether it was true or not. If the username and password is not there, then INSERT WHAT HAPPENS

**Example Request 1:** /user/login with the parameters "John" "You"

**Example Output**
{
    "isValid", true,
    "user": {
      "id": 1,
      "username": "John",
      "password": You
    }
}

**Error handling**
- error 400: if parameters aren't provided

## Create a user
**Request Format:** /user/create

**Query Parameters:** username (required), password(required)

**Request Type** Post

**Returned Data Format:** Json

**Description** If the username and password are included, it will then see if the user currently exists. If the user does not exist then returns the userid and inserts it into the database, otherwise it will not return to database and return uesrid

**Example Request:** /user/create with the parameters "Asdf" "asdf"

**Example Output**
{
    "exists", false,
    "id", 11
}

**Error handling**
- 400
  - if username and password are not provided

## See specific user
**Request Format:** /user/:id

**Query Parameters:** id (required)

**Request Type (both requests):** Get

**Returned Data Format:** JSON

**Description 1:** Will return data of user with
associated id

**Example request 1** /user/1
**Example Output 1**
{
    "user": {
      "id": 1,
      "username": "John",
      "password": You
    }
}

**Error handling**
- 400
  - if id is not provided

## Get transaction history of individual user
**Request Format:** /transactions/:id

**Query Parameters:** id (required)

**Request Type (both requests):** Get

**Returned Data Format:** JSON

**Description 1:** Will return transaction data of user with
associated id

**Example request 1** /transactions/1
**Example Output 1**
{
    "results": [
      {
        "id": 1,
        "Time": "2021-12-07 22:54:57",
        "stock": 1,
        "price": 10
      }
    ]
}

**Error handling**
- 400
  - if id is not provided

## Get listings based on search filters
**Request Format:** /listings/search

**Query Parameters:** query, rank, price, region, stock all optional

**Request Type:** Post

**Returned Data Format:** JSON

**Description** Returns the listings based on filtered data

**Example Request 1:** /listings/search with parameters of region = 'NA'

**Example Output 1**
{
  "listings": [
    {
      "id": 1,
      "username": "test1",
      "price": 9.99,
      "region": "NA",
      "description": "asdf"
    }
  ]
}

## Create and get new listing
**Request Format:** /listings/create

**Query Parameters:** username, rank, region, description, price, stock (all required)

**Request Type:** Post

**Returned Data Format:** JSON

**Description** Returns the new listing based on request body parameters.

**Example Request 1:** /listings/create

**Example Output 1**
{
  "listings": [
    {
      "id": 1,
      "username": "test1",
      "price": 9.99,
      "region": "NA",
      "description": "asdf"
    }
  ]
}

**Error Handling**
- 400
  - if all required body parameters are not in the request.

## Get confirmation code of purchase and update stock
**Request Format:** /user/purchase

**Query Parameters:** userID, listingID, stock (all required)

**Request Type:** Post

**Returned Data Format:** Plain Text

**Description** Returns a confirmation code from the database and updates the stock depending on how much
                the user purchased.

**Example Request:** /user/purchase

**Example Output**
```
8
```

**Error Handling**
- 400
  - if all required body parameters are not in the request.
