const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const pool = require('../classes/db');
const User = require('../classes/user');
const randToken = require('rand-token');
const Recipe = require('../classes/recipe');




let otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

let glEmail, glName, glPassword;

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',

    auth: {
        user: 'pvblcml@gmail.com',
        pass: 'zfaugmmgmahgwamg',
    }

});


exports.indexPage = (req, res) =>{
    try{
        session = req.session;
        if(session.userId){
            res.render('userHome', { title: 'User Home', id: session.userName});
        }
        else{
            console.log('user none...\n');
            pool.getConnection((err, conn) =>{
                if(err){
                    console.log(err);
                }
                else{
                    conn.query('SELECT * FROM rec ORDER BY rec_id DESC LIMIT 6', (err, recs) => {
                        if(err){
                            console.log(err);
                        }
                        else{
                            let msg = req.flash('msg');
                            res.render('index', { title: 'Home Page', msg, recs: recs, id: ''});
                        }
                    })
                }
            })
            
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
    
}

exports.registerPage = (req, res) => {
    let msg = req.flash('msg');
    res.render('register', { title: 'Register Page', msg, id: ''});
}

exports.getRegData = (req,res) => {
    try{
        pool.getConnection((err, conn) => {
       
            if(err){
                console.log(err);
            }
            else{
                console.log('Connected to db in controllers...\n');
                //getting data from reg form
                let user = new User.User();
                user.name = req.body.regNameInp;
                user.email = req.body.regEmailInp;
                user.password = req.body.regPasswordInp;
                glName = user.getUserName();
                glEmail = user.getUserEmail();
                glPassword = user.getUserPassword();
                let rePassword = req.body.regRePasswordInp;
                if(user.getUserPassword().length < 8){
                    req.flash('msg', 'Passwords should be at least 8 characters!');
                    res.redirect('/register'); 
                }
                if(user.getUserPassword() !== rePassword){
                    req.flash('msg', 'Passwords does not match!');
                    res.redirect('/register');    
                }
                else{
                    conn.query('SELECT * FROM users WHERE user_email = ?', [user.email], (err, row) => {
                        if(err){
                            console.log(err, '\n');
                            conn.release();
                        }
                        else if(row.length > 0)
                        {
                            req.flash('msg', 'Email is already registered!');
                            conn.release();
                            res.redirect('/register');
                        }
                        else{
                            // send mail with defined transport object
                            var mailOptions = {
                                from: 'pvblcml@gmail.com',
                                to: user.getUserEmail(),
                                subject: 'ReciPinoy Email Verification',
                                text: 'Your OTP is: ' + otp.toString()
                                
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    console.log(error);
                                }

                                res.redirect('/verify');
                            });

                          
                        }
                    })
                    
                }
            }
        });
    }
    catch(error){
        res.json({ message: error.message });
    }
    
}
exports.loginPage = (req, res) => {
    let msg = req.flash('msg');
    res.render('login', { title: 'Login Page', msg, id: ''});
}

exports.getLoginData = (req, res) => {
    try{
        pool.getConnection((err, conn) => {
            if(err){
                console.log(err);
                conn.release();
            }
            else{
                let user = new User.UserLogin();
                user.email = req.body.loginEmailInp;
                user.password = req.body.loginPasswordInp;
                conn.query('SELECT * FROM users WHERE user_email = ?', [user.getLoginEmail()], (err, result) =>{
                    if(err){
                        console.log(err, '\n');
                        conn.release();
                    }
                    else{
                        if(result.length > 0){
                            bcrypt.compare(user.getLoginPassword(), result[0].user_password, (err, row) => {
                                if(row){
                                    session = req.session;
                                    session.userId = result[0].user_id;
                                    session.userName = result[0].user_name;
                                    console.log(req.session, '\n');
                                    conn.release();
                                    res.redirect('/home');
                                    
                                }
                                else{
                                    conn.release();
                                    req.flash('msg', 'Invalid credentials!');
                                    res.redirect('/login');
                                }
                            })
                        }
                    
                    }
                })
            }
        })
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }

  
}
exports.userLogout = (req,res) => {
    try{
        if(req.session.userId){
            req.session.destroy();
            console.log('session user destroy');
            console.log(req.session, '\n');
            //conn.destroy();
            res.redirect('/');
            
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
    
}

exports.userHome = (req,res) => {
    try{
        session = req.session;
        if(session.userId){
            res.render('userHome', {title: 'User Homepage', id: session.userName});
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
    
}
exports.otpPage = (req, res) => {
    try{
        let msg = req.flash('msg');
        res.render('otpVerify', { title: 'Verify your email',  msg});
    }
    catch(error){
        res.status(500).json({ message: error.message});
    }
}

exports.userVerified = async(req,res) => {
    try{  
        if (req.body.otpInp == otp) {
            console.log('successfully registered!\n');
            //let user = new User();
            //console.log(user.getUserEmail());
            bcrypt.genSalt(10, async (err, salt) => {
                await bcrypt.hash(glPassword, salt, (err, hash) =>{
                    const hashed = hash;
                    pool.getConnection((err, conn) => {
                        conn.query('INSERT INTO users(user_name, user_email, user_password) VALUES (?, ?, ?)', [glName, glEmail, hashed], (err, result) => {
                            if(err){
                                console.log(err,'\n');
                                conn.release();
                            }
                            else{
                                console.log('user inserted! \n');
                                conn.release();
                                req.flash('msg', 'Email verified! You can now login!');
                                res.redirect('/login');
                            }
                        })
                    })
                })
            })
            
        }
        else {
            req.flash('msg', 'Incorrect OTP! Try again!');
            res.redirect('/verify');
            //res.render('otpVerify', { title: 'Verify your email', msg: 'otp is incorrect'});
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
}

exports.userForgotPwd = (req, res) => {
    try {
        let msg = req.flash('msg');
        res.render('forgotPwd', { title: 'Password Reset', msg});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSendPwdEmail = (req, res) => {
    try {
        let email = req.body.fpEmail;
        pool.getConnection((err, conn) =>{
            if(err){
                console.log(err, '\n');
                conn.release();
            }
            else{
                conn.query('SELECT * FROM users WHERE user_email = ?', [email], (err, user) => {
                    if(err){
                        console.log(err, '\n');
                        conn.release();
                        res.redirect('/');
                    }
                    else if(user.length == 0){
                        req.flash('msg', 'Email not found!');
                        res.redirect('/forgot-password');
                    }
                    else{
                        let userEmail = user[0].user_email;
                        let token = randToken.generate(20);
                        var mailOptions = {
                            from: 'pvblcml@gmail.com',
                            to: userEmail,
                            subject: 'ReciPinoy Reset Password Link',
                            html: '<p>You requested for reset password, kindly use this <a href="http://localhost:3000/reset-password?token=' + token + '"><strong>link</strong></a> to reset your password</p>'
                            
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                                conn.release();
                            }
                            console.log('Message sent: %s', info.messageId);
                            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                            
                        });
                        conn.query('UPDATE users SET user_token = ? WHERE user_email = ?', [token, userEmail], (err, row) =>{
                            if(err){
                                console.log(err, '\n');
                                conn.release();
                            }
                            else{
                                conn.release();
                                req.flash('msg', 'Email for password reset is sent!');
                               // console.log('Reset password email is sent...\n');
                                res.redirect('/');
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userResetPwd = (req, res) =>{
    try {
        let msg = req.flash('msg');
        res.render('resetPwd', { title: 'Password Reset', token: req.query.token, msg});
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userUpdatePwd = (req, res) =>{
    try {
        let token = req.body.tokenInp;
        let password = req.body.newPwdInp;
        let passwordConf = req.body.newPwdInpConf;
        if(password !== passwordConf){
            req.flash('msg', 'Passwords does not match!');
            //alert('Passwords does not match');
            res.redirect('http://localhost:3000/reset-password?token=' + token + '');    
        }
        else{
            pool.getConnection((err, conn) =>{
                if(err){
                    console.log(err, '\n');
                }
                else{
                    conn.query('SELECT * FROM users WHERE user_token = ?', [token], (err, user) => {
                        if(err){
                            console.log(err, '\n');
                        }
                        else{
                            bcrypt.genSalt(10, async (err, salt) => {
                                await bcrypt.hash(password, salt, (err, hash) =>{
                                    const hashed = hash;
                                    conn.query('UPDATE users SET user_password = ? WHERE user_token = ?', [hashed, token], (err, result) => {
                                        if(err){
                                            console.log(err,'\n');
                                            conn.release();
                                        }
                                        else{
                                            //console.log('password updated! \n');
                                            req.flash('msg', 'You can now login with your new password!');
                                            conn.release();
                                            res.redirect('/login');
                                        }
                                    })
                                })
                            })
                        }
                    })
                }
            })
        }
       
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSearch = (req, res) => {
    try {
        pool.getConnection((err, conn) =>{
            if(err){
                console.log(err, '\n');
            }
            else{
                let search = req.body.searchInp;
                conn.query('SELECT * FROM rec WHERE rec_name LIKE ?', ['%' + search + '%'], (err, result) => {
                    if(err){
                        console.log(err, '\n');
                    }
                    else{
                        session = req.session;
                        if(session.userId){
                            res.render('userSearchResults', {title: 'Search Results', recs: result, id: session.userName});
                        }
                        else{
                            res.render('userSearchResults', {title: 'Search Results', recs: result, id: ''});
                        }
                        
                    }   
                })
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecipeView = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if(err){
                console.log('error in user recipes...\n');
            }
            else{
                let rId = req.params.id;
                conn.query('SELECT * FROM rec WHERE rec_id = ?',[rId], (err, recs) => {
                    if(err){
                        console.log('cannot fetch recipes in db...\n');
                    }
                    else{
                        let regexQuant = /[+-]?\d+(\.\d+)?/g;
                        let regexStr = /\b(\w+)\b/g;
                        let finalStr = '';
                        let quantArr = [];
                        let recIngs = [];
                        let ingStringArr = [];
                        let ingI = [];
                        let insArr = [];
                        let ingIStr = '';
                        let ingStr = '';
                        let qStr = 'SELECT recing.*, ing_name FROM `recing` INNER JOIN ing ON recing.ingId=ing.ing_id WHERE recing.recId = ?';
                        function getIngs(id){
                            return new Promise((resolve, reject) => {
                                conn.query(qStr, [id], (err, ings) => {
                                    if(err){
                                        console.log(err, '\n');
                                    }
                                    else{
                                        ings.forEach(ing => {
                                            let ingq = ing.ingQuant;
                                            let ingu = ing.ingUnit;
                                            let ingi = ing.ingIns;
                                            
                                            if(!ing.ingQuant){
                                                ingq = 0;
                                            }
                                            if(!ing.ingUnit){
                                                ingu = '';
                                            }
                                            if(!ing.ingIns){
                                                ingi = '';
                                            }
                                            let temp = ingq + ' ' + ingu + ' ' + ing.ing_name;
                                            let ii = ' '+ ingi;
                                            ingStringArr.push(temp);
                                            ingI.push(ii);
                                        });
                                        ingStr = ingStringArr.join('/');
                                        ingIStr = ingI.join('/');
                                        let strConcat = ingStr.concat('*', ingIStr);
                                        ingStringArr = [];
                                        ingI = []; 
                                        resolve(strConcat);
                                    }
                                })
                            })
                        }
                        
                        async function getAllRecIng(r){
                            for(id of r){
                                ingStr = await getIngs(id.rec_id);
                                let strArr = ingStr.split('*');
                                let qui = strArr[0]
                                let ins = strArr[1];
                                insArr = ins.split('/');
                                let ingArr = qui.split('/');
                                for (const i of ingArr) {
                                    let quantNum = i.match(regexQuant);
                                    let iStr = i.match(regexStr); 
                                    if(Array.isArray(quantNum)){
                                        quantArr.push(quantNum[0]);
                                    }else{
                                        quantArr.push(quantNum);
                                    }
                                    for (let index = 0; index < iStr.length; index++) {
                                        const element = iStr[index];
                                        if (isNaN(element)) {
                                            finalStr += ' ' + element;
                                        }
                                    }
                                    recIngs.push(finalStr);
                                    finalStr = '';
                                }
                            }
                            //console.log(quantArr);
                            conn.release();
                            let msg = req.flash('msg');
                            session = req.session;
                            if(session.userId){
                                res.render('userRecipeView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: session.userName});
                            }
                            else{
                                res.render('userRecipeView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: ''});
                            }
                            
                        }
                        getAllRecIng(recs);
                    }
                })
                         
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecommendRecipe = (req,res) =>{
try {
pool.getConnection((err, conn) => {
    if(err){
        console.log(err);
    }
    else{
        let recomm = new Recipe.Recomm();
        recomm.ings = JSON.parse(req.body.ingsVal);
        let exIngNum = req.body.exIngNum;
        //to get recipes based on ing
        let counts = {};
        let finalRids = [];
        let recIds = []; 
        let ingsId = [];
        let recImage = [];
        let recId = [];
        let recName = [];
        let userRecIds = [];
        
        function getUserFilter(id) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT user_allergy, user_restrict FROM users WHERE user_id = ?', [id], (err, row) =>{
                    if (err) {
                        console.log(err);
                    } 
                    else{
                        let ua = row[0].user_allergy;
                        let ur = row[0].user_restrict;
                        if(ua){
                            recomm.allergy = ua;
                        } 
                        if(ur){
                            recomm.restrict = ur;
                        }
                        console.log('ua: ', ua);
                        console.log('ur: ', ur);
                        resolve('got');
                    }
                })
            })
            
        }

        function getFilteredIngIds(aArr, rArr) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT * FROM ing', (err, ing) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        let idStr = ''
                        let count = 0;
                        for (let index = 0; index < ing.length; index++) {
                            const allergy = ing[index].ing_allergy;
                            const restrict = ing[index].ing_restrict;
                            const id = ing[index].ing_id;
                            if(aArr.length > 0){
                                aArr.forEach(a => {
                                    if(allergy.includes(a)){
                                        idStr += id + '/';
                                    }
                                });
                            }
                            if (rArr.length > 0) {
                                rArr.forEach(r => {
                                    if(restrict.includes(r)){
                                        if(idStr.includes(id)){
                                            count += 1;
                                        }
                                        else{
                                            idStr += id + '/';
                                        }
                                    }
                                });
                            }
                        }
                        resolve(idStr);
                    }
                })
            })
        }
        
        function getUserRecIds(id) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT recId FROM recing WHERE ingId = ?', [id], (err, ids) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        let count = 0;
                        for (let index = 0; index < ids.length; index++) {
                            const element = ids[index].recId;
                            if(userRecIds.includes(element)){
                                count += 1;
                            }
                            else{
                                userRecIds.push(element);
                            }
                        }
                        resolve();
                    }
                })
            })
        }

        function getIngId(ings) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT * FROM ing WHERE ing_name = ?', [ings], (err, iid) =>{
                    if(err){
                        console.log(err);
                    }
                    else if (iid[0]) {
                        let id = iid[0].ing_id;
                        resolve(id);
                    }
                    else{
                        req.flash('msg', 'There is an invalid ingredient! Look for misspelled and try again!');
                        res.redirect('/recommend');
                    }
                })
            })
        }
        function getRecIds(ingsId) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT recId FROM recing WHERE ingId = ? LIMIT 35', [ingsId], (err, recs) =>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        for (let index = 0; index < recs.length; index++) {
                            const element = recs[index].recId;
                            recIds.push(element);
                        }
                        resolve();
                    }  
                })
            })
        }
        function toFindDuplicates(arr){
            for(let i =0; i < arr.length; i++){ 
                if (counts[arr[i]]){
                counts[arr[i]] += 1
                } else {
                counts[arr[i]] = 1
                }
                }
                console.log(counts)
        }
        function getRecDetails(id) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT * FROM rec WHERE rec_id = ?', [id], (err, recs) =>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        let id = recs[0].rec_id;
                        let name = recs[0].rec_name;
                        let image = recs[0].rec_image;
                        //console.log(id);
                        recName.push(name);
                        recId.push(id);
                        recImage.push(image);
                        resolve();
                    }
                })
            })
        }
        async function getRecommRec() {
            let ings = recomm.getIngs();
            for(i of ings){
                const id = await getIngId(i);
                ingsId.push(id);
            }
            console.log(ingsId);
            
            for(r of ingsId){
                const rf = await getRecIds(r);
            }
            toFindDuplicates(recIds);
            let cVal = Object.values(counts);
            let mx = Math.max(...cVal);
            for (let index = mx; index > 0; --index) {
                let matched = Object.keys(counts).filter(function(key) {
                    return counts[key] === index;
                });

                matched.forEach(m => {
                    let pint = parseInt(m);
                    finalRids.push(pint);
                });
            }
            
            console.log('before session if');
            console.log(finalRids);
            if (finalRids.length == 0) {
                req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients, and user's food restrictions and allergies!");
                res.redirect('/recommend');
            }
            else{
                session = req.session;
                if(session.userId){ 
                    let result = await getUserFilter(session.userId);
                    if(result == 'got'){
                        let aArr = [];
                        let rArr = [];
                        let idFilter = [];
                        if(recomm.getAllergy()){
                            let aStr = recomm.getAllergy();
                            aArr = aStr.split(', ');
                        }
                        if(recomm.getRestrict()){
                            let rStr = recomm.getRestrict();
                            rArr = rStr.split(', ');
                        }
                        let idStr = await getFilteredIngIds(aArr, rArr);
                        idFilter = idStr.split('/'); //ing id of with restrictions and allergies
                    
                        console.log('ids of restrict ing');
                        console.log(idFilter);
                        for (const i of idFilter) {
                            const id = await getUserRecIds(i); //rec ids tht has the restriction and allergy ings
                        }
                        
                        console.log('rec ids of id filter');
                        console.log(userRecIds);
                        for (let index = 0; index < userRecIds.length; index++) {
                            const element = userRecIds[index];
                            if (finalRids.includes(element)) {
                                for(let i = 0; i < finalRids.length; i++){ 
                                    if (finalRids[i] === element) { 
                                        finalRids.splice(i, 1); 
                                    }
                                }
                            }
                            
                        }

                        if (finalRids.length > 0) {
                            for (const rec of finalRids) {
                                const rf = await getRecDetails(rec);
                            }

                            console.log(recId);
                            let msg = req.flash('msg');
                            conn.release();
                            res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, msg, id: session.userName});
                        }
                        else{
                            conn.release();
                            req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients, and user's food restrictions and allergies!");
                            res.redirect('/recommend');
                        }
                        
                        
                    }
                }
                else{
                    for (const rec of finalRids) {
                        const rf = await getRecDetails(rec);
                    }

                    console.log(recId);
                    let msg = req.flash('msg');
                    conn.release();

                    res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, msg, id: ''});
                }
            }

        }
        
        if(exIngNum > 0){
            recomm.exIngs = JSON.parse(req.body.exIngsVal);
            console.log(recomm.getExIngs());
            let exIngsId = [];
            let rIds = [];
            //query to get ing ids of excluded ings
            function getExIngsId(id) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM ing WHERE ing_name = ?', [id], (err, iid) =>{
                        if(err){
                            console.log(err);
                        }
                        else if (iid[0]) {
                            let id = iid[0].ing_id;
                            resolve(id);
                        }
                        else{
                            req.flash('msg', 'There is an invalid ingredient! Look for misspelled and try again!');
                            res.redirect('/recommend');
                        }
                    })
                })
            }
            function getFinalRecIds(i) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT recId FROM recing WHERE ingId = ? LIMIT 35', [i], (err, recs) =>{
                        if(err){
                            console.log(err);
                        }
                        else if(recs){
                            for (let index = 0; index < recs.length; index++) {
                                const element = recs[index].recId;
                                rIds.push(element);
                            }
                            //let r = recs[0].recId;
                            resolve();
                        }
                        else{
                            req.flash('msg', 'No recipes found given the inclusion and exclusion of ingredients!');
                            res.redirect('/recommend');
                        }  
                    })
                })
            }
            async function getExIngs(){
                let exIngs = recomm.getExIngs();
                for (const ex of exIngs) {
                    let exids = await getExIngsId(ex);
                    exIngsId.push(exids);
                }
                console.log(exIngsId); //ing id of excluded ings
                
                for (const i of exIngsId) {
                    const rf = await getRecIds(i);
                }
                console.log(recIds);// rec id of recs that has the excluded ings
                
                //query to get ing id for inputted ings
                let ings = recomm.getIngs();
                for(i of ings){
                    const id = await getIngId(i);
                    ingsId.push(id);
                }
                console.log(ingsId); //ing id of included ings

                for (const i of ingsId) {
                    let r = await getFinalRecIds(i);
                    //recTempIds.push(r);
                }
                console.log(rIds); // rec ids of included ings
                for (let index = 0; index < recIds.length; index++) {
                    const element = recIds[index];
                    if (rIds.includes(element)) {
                        for(let i = 0; i < rIds.length; i++){ 
                            if (rIds[i] === element) { 
                                rIds.splice(i, 1); 
                            }
                        }
                    }
                    
                }

                toFindDuplicates(rIds);
                let cVal = Object.values(counts);
                let mx = Math.max(...cVal);
                for (let index = mx; index > 0; --index) {
                    let matched = Object.keys(counts).filter(function(key) {
                        return counts[key] === index;
                    });
                    matched.forEach(m => {
                        let pint = parseInt(m);
                        finalRids.push(pint);
                    });
                }

                console.log('before session if');
                console.log(finalRids);
                if (finalRids.length == 0) {
                    req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients, and user's food restrictions and allergies!");
                    res.redirect('/recommend');
                }
                else{
                    session = req.session;
                    if(session.userId){ 
                        let result = await getUserFilter(session.userId);
                        if(result == 'got'){
                            let aArr = [];
                            let rArr = [];
                            let idFilter = [];
                            if(recomm.getAllergy()){
                                let aStr = recomm.getAllergy();
                                aArr = aStr.split(', ');
                            }
                            if(recomm.getRestrict()){
                                let rStr = recomm.getRestrict();
                                rArr = rStr.split(', ');
                            }
                            let idStr = await getFilteredIngIds(aArr, rArr);
                            idFilter = idStr.split('/'); //ing id of with restrictions and allergies
                        
                            console.log('ids of restrict ing');
                            console.log(idFilter);
                            for (const i of idFilter) {
                                const id = await getUserRecIds(i); //rec ids tht has the restriction and allergy ings
                            }
                            
                            console.log('rec ids of id filter');
                            console.log(userRecIds);
                            for (let index = 0; index < userRecIds.length; index++) {
                                const element = userRecIds[index];
                                if (finalRids.includes(element)) {
                                    for(let i = 0; i < finalRids.length; i++){ 
                                        if (finalRids[i] === element) { 
                                            finalRids.splice(i, 1); 
                                        }
                                    }
                                }
                                
                            }
    
                            if (finalRids.length > 0) {
                                for (const rec of finalRids) {
                                    const rf = await getRecDetails(rec);
                                }
    
                                console.log(recId);
                                let msg = req.flash('msg');
                                conn.release();
                                res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, msg, id: session.userName});
                            }
                            else{
                                conn.release();
                                req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients, and user's food restrictions and allergies!");
                                res.redirect('/recommend');
                            }
                            
                            
                        }
                    }
                    else{
                        for (const rec of finalRids) {
                            const rf = await getRecDetails(rec);
                        }
    
                        console.log(recId);
                        let msg = req.flash('msg');
                        conn.release();
    
                        res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, msg, id: ''});
                    }
                }
                
            }
            //func to return reciped without the excluded ings
            getExIngs();
        }
        else{ 
            //func to return recipes based on ings
            getRecommRec();
        }
    }
})
} catch (error) {
res.status(500).json({ message: error.message});
}
}

exports.userRateRec = (req, res) =>{
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                let rate = req.body.recRating;
                // console.log(rate);
                let id = req.params.id;
                // console.log(id);
                conn.query('UPDATE rec SET rec_rate = ? WHERE rec_id = ?', [rate, id], (err, row) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        req.flash('msg', 'Recipe successfully rated!');
                        res.redirect('/recipes/' + id);
                    }
                })
            })
        }else{
            req.flash('msg', 'You need to login to rate the recipe!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecipes = (req, res) =>{
    try {
        function getRec(conn, name) {
            conn.query('SELECT * FROM rec', (err, recs) => {
                if (err) {
                    console.log(err);   
                } else {
                    res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                }
            })
        }
        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err);
            } else{
                session = req.session;
                if (session.userId) {
                    getRec(conn, session.userName);
                }
                else{
                    getRec(conn, '');
                }
            }
        })
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSortRecipes = (req, res) =>{
    try {
        function sortRecsA(conn, alphabet, name) {
            if (alphabet === 'a-z') {
                conn.query('SELECT * FROM rec ORDER BY rec_name', (err, recs) =>{
                    if (err) {
                        console.log(err);   
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            } else {
                conn.query('SELECT * FROM rec ORDER BY rec_name DESC', (err, recs) =>{
                    if (err) {
                        console.log(err);   
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            }
        }
        function sortRecsR(conn, rating, name) {
            if(rating === 'h-l'){
                conn.query('SELECT * FROM rec ORDER BY rec_rate DESC', (err, recs) =>{
                    if (err) {
                        console.log(err);   
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            } else {
                conn.query('SELECT * FROM rec ORDER BY rec_rate', (err, recs) =>{
                    if (err) {
                        console.log(err);   
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            }
        }
        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err);
            } else{
                let alphabet = req.body.alphabet;
                let rating = req.body.rating;

                session = req.session;
                if (session.userId) {
                    if(alphabet){
                        sortRecsA(conn, alphabet, session.userName)
                    }
                    else{
                        sortRecsR(conn, rating, session.userName);
                    }
                }
                else{
                    if(alphabet){
                        sortRecsA(conn, alphabet, '')
                    }
                    else{
                        sortRecsR(conn, rating, '');
                    }
                }
            }
        })
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecommend = (req,res) =>{
    try {
        session = req.session;
        if(session.userId){
            let msg = req.flash('msg');
            res.render('recommend', {title: 'Recipe Recommender', msg, id: session.userName});
        }
        else{
            let msg = req.flash('msg');
            res.render('recommend', {title: 'Recipe Recommender', msg, id: ''});
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecommAC = (req,res) =>{
    try {
        pool.getConnection((err, conn) =>{
            if(err){
                console.log(err);
            }
            else{
                conn.query('SELECT ing_name FROM ing WHERE ing_name LIKE ? ORDER BY ing_name LIMIT 5',[req.body.ing + '%'], (err, ings) =>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        conn.release();
                        res.json({data: ings});
                    }
                })
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userRecommAdd= (req,res) =>{
    try {
        this.userRecommendRecipe(req,res); 
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.profilePage = (req,res) => {
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                if(err){
                    console.log(err);
                }
                else{
                    conn.query('SELECT * FROM users WHERE user_id = ?', [session.userId], (err, user) => {
                        if(err){
                            console.log(err);
                        } else {
                            conn.release();
                            let msg = req.flash('msg');
                            res.render('userProfile', { user: user, id: session.userName, msg})
                        }
                    })
                }
            })
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.updateProfile = (req,res) => {
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                if(err){
                    console.log(err);
                }
                else{
                    let user = new User.User();
                    user.name = req.body.userName;
                    user.allergy = req.body.faInp;
                    user.restrict = req.body.dietRInp;

                    let aStr = '';
                    let rStr = '';
                    if(user.getUserAllergy()){
                        if(Array.isArray(user.getUserAllergy())){
                            user.getUserAllergy().forEach(a => {
                                aStr += a + ', ';
                            });
                        }
                        else{
                            aStr = user.getUserAllergy();
                        }
                    }
                    if(user.getUserRestrict()){
                        if(Array.isArray(user.getUserRestrict())){
                            user.getUserRestrict().forEach(r => {
                                rStr += r + ', ';
                            });
                            rStr = rStr.toLowerCase();
                        }
                        else{
                            rStr = user.getUserRestrict();
                            rStr = rStr.toLowerCase();
                        }
                    }

                    conn.query('UPDATE `users` SET `user_name`= ? ,`user_allergy`= ?,`user_restrict`= ? WHERE user_id = ?', [user.getUserName(), aStr, rStr, session.userId], (err, user) => {
                        if(err){
                            console.log(err);
                        } else {
                            conn.release();
                            req.flash('msg', 'profile successfully updated!');
                            res.redirect('/profile');
                        }
                    })
                }
            })
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.groceryPage = (req, res) => {
    try {
        session = req.session;
        if(session.userId){
            function getGList() {
                return new Promise((resolve, reject) => {
                    pool.getConnection((err, conn) => {
                        if (err) {
                            console.log(err);
                        } else {
                            conn.query('SELECT user_grocery FROM users WHERE user_id = ?', [session.userId], (err, rows) => {
                                if (err) {
                                    console.log(err);       
                                } else {
                                    let gListStr = rows[0].user_grocery;
                                    resolve(gListStr);
                                }
                            })
                        }
                    })
                })
            }
            async function renderPage() {
                let gListArr = [];
                let str = await getGList();
                gListArr = str.split('/');

                let msg = req.flash('msg');
                res.render('grocery', {msg, id: session.userName, list: gListArr});
            }

            renderPage();
        }
        else{
            req.flash('msg', 'you need to log in first!');
            res.redirect('/login');
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.addGrocery = (req,res) => {
    try {
        session = req.session;
        if(session.userId){
            let recId = req.body.recId;
            let gList = JSON.parse(req.body.gList);
            let gListStr = '';
            if(Array.isArray(gList)){
                gList.forEach(g => {
                    gListStr += g + '/';
                });
            }
            else{
                gListStr = gList;
            }
            pool.getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                } else {
                    conn.query('SELECT user_grocery FROM users WHERE user_id = ?', [session.userId], (err, row) =>{
                        if (err) {
                            console.log(err);
                        } else {
                            let listStr = row[0].user_grocery;
                            if(listStr){
                                listStr += gListStr + '/';
                                updateGList(listStr);
                            }
                            else{
                                updateGList(gListStr);
                            }
                        }
                    })
                    function updateGList(str){
                        conn.query('UPDATE `users` SET `user_grocery`= ? WHERE user_id = ?', [str, session.userId], (err, row) =>{
                            if (err) {
                                console.log(err);
                            } else {
                                conn.release();
                                req.flash('msg', 'ingredients added to your grocery list!');
                                res.redirect('/recipes/' + recId);
                            }
                        })
                    }
                }
            })
        }
        else{
            req.flash('msg', 'you need to log in first!');
            res.redirect('/login');
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.addItem = (req, res) => {
    try {
        session = req.session;
        if(session.userId){
            console.log('here in addItem');
            pool.getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                }
                else{
                    if(req.body.itemVal){
                        let newListArr = JSON.parse(req.body.itemVal);
                        console.log(newListArr);
                        let newListStr = '';
                        if(Array.isArray(newListArr)){
                            newListArr.forEach(i => {
                                newListStr += i + '/';
                            });
                        }
                        else{
                            newListStr = newListArr;
                        }

                        conn.query('UPDATE `users` SET `user_grocery`= ? WHERE user_id = ?', [newListStr, session.userId], (err, row) =>{
                            if (err) {
                                console.log(err);
                            } else {
                                conn.release();
                                res.redirect('/grocery-list');
                            }
                        })

                    }
                    else{
                        conn.query('UPDATE `users` SET `user_grocery`= ? WHERE user_id = ?', [null, session.userId], (err, row) =>{
                            if (err) {
                                console.log(err);
                            } else {
                                conn.release();
                                res.redirect('/grocery-list');
                            }
                        })
                    }


                }

            })
        }
        else{
            req.flash('msg', 'you need to log in first!');
            res.redirect('/login');
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}