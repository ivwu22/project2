//route that shows user profile
const express = require('express');
const db = require('../../models');
const methodOverride = require('method-override');
const isLoggedIn = require('../../middleware/isLoggedIn');
const router = express.Router();

router.use(methodOverride('_method'));

// Routes
router.get('/', isLoggedIn, async (req, res) => {
    const user = await db.user.findOne({where:{id:req.user.id}})
    res.render('user/profile', {user:user});
});

router.get('/edit', isLoggedIn, async (req, res) => {
    const user = await db.user.findOne({where:{id:req.user.id}});
    res.render('user/profileEdit.ejs', {user:user})
})

router.put('/edit/:id', isLoggedIn, async (req, res) => {
    const userUpdate = await db.user.update({name:req.body.name.toLowerCase(), email:req.body.email},{where:{id:req.user.id}})
    res.redirect('/user/profile');
})


module.exports = router;