/**
 * Name: Eliott Yoo, John You
 * Date: 12/11/2021
 * Section: CSE 154 AE: Tim Mandzyuk & Nikola Bojanic
 *
 * This is the script.js file to implement functionality to the BoostYou website. This is used to
 * control the various displays, give functionality to the buttons and gives meaning to the user
 * input.
 */
'use strict';

(function() {

  window.addEventListener("load", init);
  let currentUser = null;

  /**
   * Initializes when window loads, loads the intial listings
   */
  function init() {
    getRequest('/listings', loadListings, false);
    id('profile-btn').addEventListener('click', viewProfile);
    id('home-btn').addEventListener('click', showHomeScreen);
    id("login-btn").addEventListener('click', showLoginScreen);
    id('logout-btn').addEventListener('click', handleLogout);
    id("login-form").addEventListener('submit', (event) => {
      processUserInfo(event, '/user/login', onLogin, true);
    });
    id('create-btn').addEventListener('click', showCreateScreen);
    id('create-form').addEventListener('submit', (event) => {
      processUserInfo(event, '/user/create', onCreate, false);
    });
    id('listing-btn').addEventListener('click', showListingScreen);
    id('listing-nav').addEventListener('submit', parseFilterValues);
    id('listing-form').addEventListener('submit', (event) => {
      processListing(event, 'listings/create');
    });
  }

  /**
   * loads the given listings onto the site
   * @param {Object} data - data of the listings;
   */
  function loadListings(data) {
    let cards = qsa('.card');
    for (let i = 0; i < cards.length; i++) {
      let card = cards[i];
      id('listings').removeChild(card);
    }
    let listings = data.listings;
    for (let i = 0; i < listings.length; i++) {
      let card = makeCard(listings[i]);
      id("listings").appendChild(card);
    }
  }

  /**
   * creates card for one individual listing
   * @param {Object} cardData data for a single listing
   * @returns {div} div - the element with the card data
   */
  function makeCard(cardData) {
    let div = gen("div");
    div.classList.add("card");
    div.id = cardData.id; // set id of card to the id from the response data
    let data = ['username', 'price', 'region', 'rank'];
    for (let i = 0; i < data.length; i++) {
      let title = data[i];
      title = title.charAt(0).toUpperCase() + title.slice(1);
      let para = gen("p");
      let info = cardData[data[i]];
      if (i === 3) {
        info = info.charAt(0).toUpperCase() + info.slice(1);
      }
      para.textContent = title + " : " + info;
      div.appendChild(para);

      // added eventlistener on card so that when user clicks on card, it shows item view.
      div.addEventListener("click", getItemInfo);
    }
    return div;
  }

  /**
   * Parses the filter values and renders the new listings
   * @param {Event} event - event data for the submit event
   */
  function parseFilterValues(event) {
    event.preventDefault();
    let searchQuery = id('search-bar').value;
    let rank = id('rank-filter').value;
    let price = id('price-filter').value;
    let region = id('region-filter').value;
    let stock = id('stock-filter').value;
    let params = new FormData();
    params.append('query', searchQuery);
    params.append('rank', rank);
    params.append('price', price);
    params.append('region', region);
    params.append('stock', stock);
    postRequest('/listings/search', loadListings, params);
  }

  /**
   * Makes a get request to BoostYou API for listings with clicked card id.
   */
  function getItemInfo() {
    id('item-display').innerHTML = ""; // clears any previous item views
    id('item').classList.remove('hidden');
    id('listing-view').classList.add('hidden');
    id('profile').classList.add('hidden');
    id('login-screen').classList.add('hidden');
    id('creation-screen').classList.add('hidden');
    let route = "/listings/" + this.id;
    getRequest(route, showItemScreen, false);
  }

  /**
   * add description here
   * @param {Object} responseData - add description here
   */
  function showItemScreen(responseData) {
    let data = responseData.listings[0];
    id('game-count').value = '';
    id('confirmation').classList.add('hidden');
    let itemInfo = id('item-display');
    let title = gen("h2");
    title.textContent = data.description;
    itemInfo.appendChild(title);
    let attributes = ['username', 'rank', 'price', 'region', 'stock'];
    data.rank = data.rank.charAt(0).toUpperCase() + data.rank.slice(1);
    for (let i = 0; i < attributes.length; i++) {
      let type = attributes[i];
      let done = type.charAt(0).toUpperCase() + type.slice(1);
      let para = gen("p");
      para.textContent = done + ": " + data[type];
      itemInfo.appendChild(para);
    }
    if (currentUser) {
      let purchase = gen("button");
      purchase.textContent = "Buy Boost";
      purchase.setAttribute('id', 'buy-btn');
      purchase.addEventListener("click", () => confirmPurchase(responseData.listings[0], purchase));
      itemInfo.appendChild(purchase);
    } else {
      let loginPrompt = gen("p");
      loginPrompt.textContent = 'Please signin to make a purchase!';
      itemInfo.appendChild(loginPrompt);
    }
  }

  /**
   * views a user profile, if user is currently not logged in, then display message prompting
   * user to log in
   */
  function viewProfile() {
    id('listing-view').classList.add('hidden');
    id('item').classList.add('hidden');
    id('profile').classList.remove('hidden');
    id('login-screen').classList.add('hidden');
    id('creation-screen').classList.add('hidden');
    clearProfile();
    let profile = id('info');
    if (currentUser === null) {
      let div = gen('div');
      let text = gen('p');
      text.textContent = 'Please login to view your profile!';
      div.appendChild(text);
      profile.appendChild(div);
      id('transactions').classList.add('hidden');
    } else {
      id('transactions').classList.remove('hidden');
      let url = '/transactions/' + currentUser.id;
      getRequest(url, loadTransactions);
    }
  }

  /**
   * clears the profile page
   */
  function clearProfile() {
    let profile = id('info');
    while (profile.firstChild) {
      profile.removeChild(profile.firstChild);
    }
    let transactions = id('transactions');
    let length = transactions.children.length;
    let i = 0;
    while (i < length - 1) {
      transactions.removeChild(transactions.lastChild);
      i = i + 1;
    }
  }

  /**
   * loads the transaction data for a given user
   * @param {*} data - transaction data for a given user
   */
  function loadTransactions(data) {
    const results = data.results;
    const columns = ['id', 'Time', 'stock', 'price'];
    for (let i = 0; i < results.length; i++) {
      let div = gen('div');
      div.classList.add('transaction');
      for (let j = 0; j < columns.length; j++) {
        let type = columns[j];
        let title = type.charAt(0).toUpperCase() + type.slice(1);
        let para = gen("p");
        para.classList.add('transaction-text');
        let result = results[i][type];
        if (j === 3) {
          result = results[i].price * results[i].stock;
        }
        para.textContent = title + ": " + result;
        div.appendChild(para);
      }
      id('transactions').appendChild(div);
    }
  }

  /**
   * handles both create and login
   * @param {Event} event - event of the clicked element
   * @param {String} url - url of the request
   * @param {Function} func - callback function passed in for the post request
   * @param {boolean} isLogin - determines if it is login or account creation
   */
  function processUserInfo(event, url, func, isLogin) {
    event.preventDefault();
    let username = id("username").value;
    let password = id("password").value;
    if (!isLogin) {
      username = id('user-create').value;
      password = id('pass-create').value;
    }
    let params = new FormData();
    params.append('username', username);
    params.append('password', password);
    postRequest(url, func, params);
  }

  /**
   * handles new listing form
   * @param {*} event event of the clicked element
   * @param {*} url url of the request
   * @param {*} func callback function passed in for the post request
   */
  function processListing(event, url) {
    event.preventDefault();
    let username = currentUser.username;
    let rank = id('rank-listing').value;
    let region = id('region-listing').value;
    let description = id('description').value;
    let price = id('price-listing').value;
    let stock = id('stock-listing').value;
    let params = new FormData();
    params.append('username', username);
    params.append('rank', rank);
    params.append('region', region);
    params.append('description', description);
    params.append('price', price);
    params.append('stock', stock);
    postRequest(url, loadListings, params, false);
    id('rank-listing').value = "";
    id('region-listing').value = "";
    id('description').value = "";
    id('price-listing').value = "";
    id('stock-listing').value = "";
  }

  /**
   * handles the login if its correct or incorrect, if correct then handles login if incorrect then
   * tells users that login is incorrect
   * @param {Object} data - data on the return, shows whether it is valid and what the user data is
   */
  function onLogin(data) {
    let valid = data.isValid;
    if (valid) {
      setUser(data);
      id("username").value = "";
      id('password').value = "";
      qs('form p').classList.add('hidden');
    } else {
      id('invalid-login').classList.remove('hidden');
    }
  }

  /**
   * handles the account creation, if user is taken then displays text message
   * to user, otherwise handles creation and logs in user
   * @param {Object} data - data on the return, gives whether exists and id
   */
  function onCreate(data) {
    let exists = data.exists;
    if (!exists) {
      id('taken').classList.add('hidden');
      let url = 'user/' + data.id;
      getRequest(url, setUser, false);
      id('user-create').value = '';
      id('pass-create').value = '';
    } else {
      id('taken').classList.remove('hidden');
    }
  }

  /**
   * sets the current user data as the user
   * switches login button and goes back to home screen
   * @param {Object} data - data of the user
   */
  function setUser(data) {
    currentUser = data.user;
    toggleLoginBtn();
    showHomeScreen();
  }

  /**
   * switches the login and logout button, only one can be showing at a given time
   */
  function toggleLoginBtn() {
    id('login-btn').classList.toggle('hidden');
    id('logout-btn').classList.toggle('hidden');
  }

  /**
   * logs the user out and goes back to the home screen
   */
  function handleLogout() {
    toggleLoginBtn();
    currentUser = null;
    showHomeScreen();
  }

  /**
   * makes intial purchase button unclickable and handles the form
   * @param {Object} data - data of the listing
   * @param {Object} button - purchase button
   */
  function confirmPurchase(data, button) {
    button.disabled = true;
    id('confirmation').classList.remove('hidden');
    id('confirmation').addEventListener('submit', (event) => {
      handlePurchase(event, data);
    });
    id('cancel-purchase').addEventListener('click', cancelPurchase);
  }

  /**
   * clears the values and hides the confirmation form.
   */
  function cancelPurchase() {
    id('game-count').value = '';
    id('confirmation').classList.add('hidden');
    id('buy-btn').disabled = false;
    let form = id('confirmation');
    let newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
  }

  /**
   * handles the purchases and the case where stock requested exceeds stock available
   * @param {Event} event - event object of the clicked element
   * @param {Object} data - data of the listing
   */
  function handlePurchase(event, data) {
    event.preventDefault();
    let amount = id('game-count').value;
    let form = id('confirmation');
    let newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    if (amount > data.stock) {
      let outOfStockMsg = gen('p');
      outOfStockMsg.textContent = "We do not have enough stock!";
      outOfStockMsg.setAttribute('id', "out-of-stock-message");
      id('confirmation').appendChild(outOfStockMsg);
      const twoSeconds = 2000;
      setTimeout(() => {
        id('confirmation').removeChild(outOfStockMsg);
        cancelPurchase();
      }, twoSeconds);
    } else {
      handleSuccessfulPurchase(data, amount);
    }
  }

  /**
   * handles the successful user input transaction
   * @param {Object} data - data of the listing
   * @param {int} amount - amount of stock user requested
   */
  function handleSuccessfulPurchase(data, amount) {
    let listingId = data.id;
    let userId = currentUser.id;
    let params = new FormData();
    params.append("userID", userId);
    params.append("listingID", listingId);
    params.append("stock", amount);
    postRequest('user/purchase', (resp) => {
      if (!Number.isInteger(resp)) {
        handleError();
        return;
      }
      let confirmation = gen('p');
      confirmation.textContent = 'Your order has been placed. Your confirmation ID is ' +
      resp + '. You will soon be redirected...';
      id('confirmation').appendChild(confirmation);
      const threeSeconds = 3000;
      setTimeout(() => {
        id('confirmation').removeChild(confirmation);
        viewProfile();
      }, threeSeconds);
    }, params);
  }

  /**
   * runs when user clicks the home button, shows the home screen and hides everything else
   */
  function showHomeScreen() {
    id('listing-view').classList.remove('hidden');
    id('item').classList.add('hidden');
    id('profile').classList.add('hidden');
    id('login-screen').classList.add('hidden');
    id('creation-screen').classList.add('hidden');
    id("listing-screen").classList.add("hidden");
  }

  /**
   * runs when the user clicks the login button, shows the login screen and hides everything else
   */
  function showLoginScreen() {
    id('login-screen').classList.remove('hidden');
    id('item').classList.add('hidden');
    id('profile').classList.add('hidden');
    id('listing-view').classList.add('hidden');
    qs('form p').classList.add('hidden');
    id('creation-screen').classList.add('hidden');
    id("listing-screen").classList.add("hidden");
  }

  /**
   * shows the user creation screen and hides all other screens
   */
  function showCreateScreen() {
    id('listing-view').classList.add('hidden');
    id('item').classList.add('hidden');
    id('profile').classList.add('hidden');
    id('login-screen').classList.add('hidden');
    id('taken').classList.add('hidden');
    id("listing-screen").classList.add("hidden");
    id('creation-screen').classList.remove('hidden');
    if (currentUser) {
      id('create-header').textContent = 'Please Logout before creating an account!';
      id('create-submit').disabled = true;
    } else {
      id('create-header').textContent = 'Account Creation';
      id('create-submit').disabled = false;
    }
  }

  /**
   * shows the user create listing screen and hides all other screens
   */
  function showListingScreen() {
    id("listing-screen").classList.remove("hidden");
    id('item').classList.add('hidden');
    id('profile').classList.add('hidden');
    id('login-screen').classList.add('hidden');
    id('taken').classList.add('hidden');
    id('creation-screen').classList.add('hidden');
    id('listing-view').classList.add('hidden');
    if (currentUser) {
      id('listing-header').textContent = "Create a Listing!";
      id('listing-form').classList.remove('hidden');
      id('listing-submit').disabled = false;
    } else {
      id('listing-header').textContent = "Please Sign-in before creating a listing!";
      id('listing-form').classList.add('hidden');
    }
  }

  /**
   * get request helper function
   * @param {String} url - link of the api
   * @param {function} func - function to process the gained data
   * @param {boolean} isText - determines if returned data is json or text
   */
  function getRequest(url, func, isText) {
    fetch(url)
      .then(statusCheck)
      .then(resp => {
        if (!isText) {
          return resp.json();
        }
        return resp.text();
      })
      .then(data => func(data))
      .catch(handleError);
  }

  /**
   * post request helper function
   * @param {String} url - link of the api
   * @param {function} process - processes the recieved data
   * @param {Object} params - parameters of the user input
   * @param {boolean} isText - determines whether it is a text or json response
   */
  function postRequest(url, process, params, isText) {
    fetch(url, {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => {
        if (!isText) {
          return resp.json();
        }
        return resp.text();
      })
      .then(process)
      .catch(handleError);
  }

  /**
   * Handles any errors, displays the error header div and hides the boost data div, also
   * disables every button!
   */
  function handleError() {
    id("boost-data").classList.add("hidden");
    id("error").classList.remove("hidden");
    let buttons = qsa('nav button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }

  /**
   *status check to make sure there is a response
   * @param {object} response - response object with information on the response from server
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();