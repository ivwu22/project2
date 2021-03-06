const passport = require('../config/ppConfig');
const db = require('../models');
const axios = require('axios');
const Sequelize = require('sequelize');

// ################################################
// # Helper functions for other controllers
// ################################################

// Axios request
async function requestAxios (searchQuery) {
    let allRecipes = [];
    const options = ['food', 'main', 'pasta', 'delicious']
    const searchResults = {
        method: 'GET',
        url: "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/search",
        params: {
            query: "burger",
            number: '20',
            ofset: '0',
        },
        headers: {
            'x-rapidapi-key': process.env.API_KEY,
            'x-rapidapi-host': process.env.API_HOST
        }
    }
    console.log("search query within request axios >>>>", searchQuery);
    if (searchQuery) {
        searchResults["params"].query = searchQuery
    } else {
        searchResults["params"].query = options[Math.floor(Math.random()*(options.length))]
    }
    const responseData = await axios.request(searchResults);
    let results = responseData.data.results
    console.log(`This is the results before setting allRecipes >>>>${results}`);
    allRecipes = results
    for (let i = 0; i < results.length; i++){
        // console.log(results[i])
        const [recipe, created] = await db.recipe.findOrCreate({
            where: {
                title : results[i].title,
                api : results[i].id,
                image : results[i].image,
                readyInMinutes : results[i].readyInMinutes,
                servings : results[i].servings
            }
        })
        allRecipes.push(recipe);
    }
    return allRecipes; 
}





// Loads recipe ids that have been favorited by user
async function findFavorites(req){
    try{
        const favoriteRecipeId=[];
        if(req.user) {
            const favorites = await db.favorites.findAll({where:{userId:req.user.id}})
            for (let item in favorites){
                favoriteRecipeId.push(favorites[item].recipeId)
            }
        } 
        return favoriteRecipeId;
    } catch (error) {
        res.render('main/404.ejs', {error:error})
    }
}


// Helper functions for routes

function loadRecipesForDay(req){
    const favoritedByDays = [false, false, false, false, false, false, false];
    db.user.findOne({
        where:{
            id: req.user.id
        }, include:[db.recipe]
    }).then(function(foundUser){
        for (let item in foundUser.recipes) {
            favoritedByDays[(foundUser.recipes[item].dataValues.favorites.dataValues.day)+1]=foundUser.recipes[item]
        }
        return favoritedByDays
    })
    
}

// ################################################
// # Recipe Randomizer Functions
// ################################################

// Loads random recipes for the dashboard
async function loadRandomRecipes(res, favoriteRecipeId){
    try {
        const randomRecipes = [];
        const recipes = await db.recipe.findAll({
            where:{
                id: {
                    [Sequelize.Op.notIn]:favoriteRecipeId
                }
            }
        });
        const randomNumbers = getTwoRandom(recipes.length);
        for (let item in randomNumbers){
            randomRecipes.push(recipes[randomNumbers[item]]);
        }
        return randomRecipes;
    } catch (error){
        res.render('main/404.ejs', {error:error})
    }
}


function getRandomInt(min, max){
    min = Math.ceil(min);
    max= Math.floor(max);
    return Math.floor(Math.random()*(max-min)+min);
}

// This function gets two random recipes overall but not the ones we have already favorited
function getTwoRandom(max){
    const randomNumbers= [];
    // Push two random numbers onto the array
    randomNumbers.push(getRandomInt(0,max));
    randomNumbers.push(getRandomInt(0,max));
    // If the first and second number in the array are the same, change the second random number (Max number of loops = 10)
    let key = 0;
    while((key <= 10 && randomNumbers[0]===randomNumbers[1]) ){
        randomNumbers[1]=getRandomInt(0,max);
        key++;
    }
    return randomNumbers;
}

// This function gets two random recipes from the ones I have already favorited
function getTwoFavorites(recipeArray){
    console.log("recipeArray is ",recipeArray);
    const twoFavorites=[];
    for(let item in recipeArray){
        twoFavorites.push(recipeArray[item]);
    }
    return twoFavorites;
}

// Get names of recipes
function getNames(recipeArray){
    const nameArray=[];
    for(let item in recipeArray){
        nameArray.push(recipeArray[item].dataValues.name)
    }
    return nameArray;
}


module.exports = {
    findFavorites,
    getTwoRandom,
    getTwoFavorites,
    loadRandomRecipes,
    requestAxios,
    getNames 
}