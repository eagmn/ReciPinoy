const bcrypt = require('bcryptjs');
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
            pool.getConnection((err, conn) =>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM rec ORDER BY rec_id DESC LIMIT 12', (err, recs) => {
                        if(err){
                            console.log(err);
                            conn.release();
                        }
                        else{
                            let name = session.userName;
                            conn.release();
                            res.render('userHome', {title: name +'\'s Homepage', recs: recs, id: session.userName});
                        }
                    })
                }
            })
            
        }
        else{
            console.log('user none...\n');
            pool.getConnection((err, conn) =>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM rec ORDER BY rec_id DESC LIMIT 12', (err, recs) => {
                        if(err){
                            console.log(err);
                            conn.release();

                        }
                        else{
                            let msg = req.flash('msg');
                            conn.release();
                            res.render('index', { title: 'ReciPinoy', msg, recs: recs, id: ''});
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
                conn.release();

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
                    conn.release();
                    req.flash('msg', 'Short passwords are easy to guess. Make one with at least 8 characters!');
                    res.redirect('/register'); 
                }
                if(user.getUserPassword() !== rePassword){
                    conn.release();
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
                            req.flash('msg', 'Your email is already registered!');
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
                                    conn.release();
                                }

                                conn.release();
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
                        else{
                            conn.release();
                            req.flash('msg', 'Invalid credentials!');
                            res.redirect('/login');
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
        let resp = req.body.logoutRes;
        if (resp === 'Yes') {
            req.session.destroy();
            console.log('session user destroy...\n');
            if(req.session){
                console.log(req.session, '\n');
            }
            else{
                console.log('no session atm...\n');
            }
            res.redirect('/');  
        } 
        else {
            res.redirect('back');
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
            pool.getConnection((err, conn) =>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM rec ORDER BY rec_id DESC LIMIT 12', (err, recs) => {
                        if(err){
                            console.log(err);
                            conn.release();
                        }
                        else{
                            let name = session.userName;
                            conn.release();
                            res.render('userHome', {title: name +'\'s Homepage', recs: recs, id: session.userName});
        
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
            console.log('Successfully Registered!\n');
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
            req.flash('msg', 'Incorrect OTP! Please try again!');
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
                        conn.release();
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
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM users WHERE user_token = ?', [token], (err, user) => {
                        if(err){
                            console.log(err, '\n');
                            conn.release();
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
                conn.release();
            }
            else{
                let search = req.body.searchInp;
                conn.query('SELECT * FROM rec WHERE rec_name LIKE ?', ['%' + search + '%'], (err, result) => {
                    if(err){
                        console.log(err, '\n');
                        conn.release();
                    }
                    else{
                        let isSaved = false;
                        let recid = result.rec_id;
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Search Results', recs: result, id: session.userName, isSaved: isSaved});
                                }
                            }) 
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Search Results', recs: result, id: '', isSaved: ''});
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
                        conn.release();
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
                            let msg = req.flash('msg');
                            session = req.session;
                            let isRated = false;
                            let isSaved = false;
                            let isMeal = false;
                            // let ratedArr = [];
                            if(session.userId){
                                conn.query('SELECT user_ratedRecs, user_Saved, user_mealPlan FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                    if(err){
                                        console.log(err);
                                        conn.release();
                                    }
                                    else{
                                        let getRated = rated[0].user_ratedRecs;
                                        let getSaved = rated[0].user_Saved;
                                        let getMeal = rated[0].user_mealPlan;
                                        if(getRated){
                                            let ratedArr = getRated.split('/');
                                            if(ratedArr.includes(rId)){
                                                isRated = true;
                                            }
                                        }
                                        if(getSaved){
                                            let savedArr = getSaved.split('/');
                                            if(savedArr.includes(rId)){
                                                isSaved= true;
                                                console.log('isSaved');
                                            }
                                        }
                                        if(getMeal){
                                            let mealArr = getMeal.split('/');
                                            if(mealArr.includes(rId)){
                                                isMeal= true;
                                                console.log('isMeal');
                                            }
                                        }
                                        conn.release();
                                        res.render('userRecipeView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: session.userName, isRated: isRated, isSaved: isSaved, isMeal: isMeal});
                                    }
                                })
                                

                            }
                            else{
                                conn.release();
                                res.render('userRecipeView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: '', isRated: isRated, isSaved: '', isMeal: ''});
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

exports.UnsavedButton = (req, res) =>{
    try{
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                let id = req.params.id;
                conn.query('DELETE FROM saved where rec_id =?', [id], (err, result) => {
                    if(err){
                        console.log('not deleted');
                        conn.release();
                        res.redirect('/recipes/' + id); 
                        // conn.release();
                    }
                    else{
                        conn.query('DELETE FROM saved_recing WHERE rec_id =?', [id]);
                        conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, saved) => {
                            if(err){
                                console.log(err);
                                conn.release();
                            }
                            else{
                                let getSaved = saved[0].user_Saved;
                                if(getSaved){
                                    let savedArr = getSaved.split('/');
                                    if (savedArr.includes(id)) {
                                        for(let i = 0; i < savedArr.length; i++){ 
                                            if (savedArr[i] === id) { 
                                                savedArr.splice(i, 1); 
                                            }
                                        }
                                    }
                                    conn.query('UPDATE users SET user_Saved = ?', [savedArr]);
                                    console.log(id);
                                    console.log('deleted');
                                }
                            }
                        })
                        conn.release();
                        req.flash('msg', 'Recipe successfully unsaved!');
                        res.redirect('/recipes/' + id); 
                    }
                })
            })
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
}

exports.userRecommendRecipe = (req,res) =>{
try {
pool.getConnection((err, conn) => {
    if(err){
        console.log(err);
        conn.release();
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
        let recCateg = [];
        let recRate = [];
        let recRateCount = [];
        
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
                                // console.log(allergy);
                                // console.log(aArr);
                                aArr.forEach(a => {
                                    if(a){
                                        // console.log(a);
                                        if(allergy.includes(a)){
                                            idStr += id + '/';
                                        }
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
                conn.query('SELECT * FROM ing WHERE ing_name LIKE ?', ['%' + ings + '%'], (err, iid) =>{
                    if(err){
                        console.log(err);
                    }
                    else if (iid) {
                        if(iid.length === 1){
                            let id = iid[0].ing_id;
                            resolve(id);
                        }
                        else{
                            let idArr = [];
                            let idStr = '';
                            for (let index = 0; index < iid.length; index++) {
                                const element = iid[index].ing_name;
                                // if(element.trim() === ings.trim()){
                                //     id = iid[index].ing_id;
                                // }
                                if((/\s/).test(element) || element.trim() === ings.trim()){
                                    // console.log(element);
                                    let id = iid[index].ing_id;
                                    idArr.push(id);
                                }
                                
                            }
                            console.log(idArr);
                            idStr = idArr.join('/');
                            console.log(idStr);
                            resolve(idStr);

                            // let id;
                            // for (let index = 0; index < iid.length; index++) {
                            //     const element = iid[index].ing_name;
                            //     if(element.trim() === ings.trim()){
                            //         id = iid[index].ing_id;
                            //     }  
                            // }
                            // resolve(id);
                        }
                    }
                    else{
                        resolve();
                        // conn.release();
                        // req.flash('msg', 'There is an invalid ingredient! Look for misspelled word and try again!');
                        // res.redirect('/recommend');
                    }
                })
            })
        }
        function getRecIds(ingsId) {
            return new Promise((resolve, reject) => {
                conn.query('SELECT recId FROM recing WHERE ingId = ?', [ingsId], (err, recs) =>{
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
                console.log('counts: ', counts)
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
                        let categ = recs[0].rec_categ;
                        let rate = recs[0].rec_rate;
                        let count = recs[0].rec_rateCount;
                        //console.log(id);
                        recName.push(name);
                        recId.push(id);
                        recImage.push(image);
                        recCateg.push(categ);
                        recRate.push(rate);
                        recRateCount.push(count);
                        resolve();
                    }
                })
            })
        }
        async function getRecommRec() {
            let ings = recomm.getIngs();
            for(i of ings){
                console.log(i);
                const id = await getIngId(i);
                // console.log(id);
                if(id){
                    // ingsId.push(id);
                    if(typeof id === 'string'){
                        let trmStr = id.split('/');
                        trmStr.forEach(element => {
                            ingsId.push(parseInt(element));
                        });
                    }
                    else{
                        ingsId.push(id);
                    }
                }

                
            }
            console.log("ingsId: ",ingsId);
            
            for(r of ingsId){
                const rf = await getRecIds(r);
            }
            toFindDuplicates(recIds);
            let cVal = Object.values(counts);
            let mx = Math.max(...cVal);
            console.log('max match: ', mx);
            for (let index = mx; index >= 2; --index) {
                let matched = Object.keys(counts).filter(function(key) {
                    return counts[key] === index;
                });
                console.log('matched: ', matched);
                matched.forEach(m => {
                    let pint = parseInt(m);
                    finalRids.push(pint);
                });
            }
            
            console.log('before session if');
            console.log(finalRids);
            if (finalRids.length == 0) {
                conn.release();
                req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients!");
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
                            res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, recCateg: recCateg, recRate: recRate, recRateCount: recRateCount, msg, id: session.userName});
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

                    res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, recCateg: recCateg, recRate: recRate, recRateCount: recRateCount, msg, id: ''});
                }
            }

        }
        
        if(exIngNum > 0){
            recomm.exIngs = JSON.parse(req.body.exIngsVal);
            console.log('exIngs: ', recomm.getExIngs());
            let exIngsId = [];
            let rIds = [];
            //query to get ing ids of excluded ings
            function getExIngsId(id) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM ing WHERE ing_name LIKE ?', ['%' + id + '%'], (err, iid) =>{
                        if(err){
                            console.log(err);
                            conn.release();
                        }
                        else if(iid) {
                            if(iid.length === 1){
                                let id = iid[0].ing_id;
                                resolve(id);
                            }
                            else{
                                let idArr = [];
                                let idStr = '';
                                for (let index = 0; index < iid.length; index++) {
                                    const element = iid[index].ing_name;
                                    // if(element.trim() === ings.trim()){
                                    //     id = iid[index].ing_id;
                                    // }
                                    if((/\s/).test(element) || element.trim() === id.trim()){
                                        // console.log(element);
                                        let id = iid[index].ing_id;
                                        idArr.push(id);
                                    }
                                    
                                }
                                // console.log(idArr);
                                idStr = idArr.join('/');
                                // console.log(idStr);
                                resolve(idStr);
                            }
                        }
                        else{
                            resolve();
                            // conn.release();
                            // req.flash('msg', 'There is an invalid ingredient! Look for misspelled word and try again!');
                            // res.redirect('/recommend');
                        }
                        // else if (iid[0]) {
                        //     let id = iid[0].ing_id;
                        //     resolve(id);
                        // }
                        // else{
                        //     conn.release();
                        //     req.flash('msg', 'There is an invalid ingredient! Look for misspelled word and try again!');
                        //     res.redirect('/recommend');
                        // }
                    })
                })
            }
            function getFinalRecIds(i) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT recId FROM recing WHERE ingId = ?', [i], (err, recs) =>{
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
                            conn.release();
                            req.flash('msg', 'No recipes found given the inclusion and exclusion of ingredients!');
                            res.redirect('/recommend');
                        }  
                    })
                })
            }
            async function getExIngs(){
                let exIngs = recomm.getExIngs();
                for (const ex of exIngs) {
                    if(ex){
                        let exids = await getExIngsId(ex);
                        if(exids){
                            // console.log(exids);
                            if(typeof exids === 'string'){
                                let trmStr = exids.split('/');
                                trmStr.forEach(element => {
                                    exIngsId.push(parseInt(element));
                                });
                            }
                            else{
                                exIngsId.push(exids);
                            }
                            
                        }
                        
                    }
                }
                console.log('exings id: ', exIngsId); //ing id of excluded ings
                
                for (const i of exIngsId) {
                    const rf = await getRecIds(i);
                }
                console.log(recIds);// rec id of recs that has the excluded ings
                
                //query to get ing id for inputted ings
                let ings = recomm.getIngs();
                for(i of ings){
                    // console.log(i);
                    const id = await getIngId(i);
                    if(id){
                        // ingsId.push(id);
                        if(typeof id === 'string'){
                            let trmStr = id.split('/');
                            trmStr.forEach(element => {
                                ingsId.push(parseInt(element));
                            });
                        }
                        else{
                            ingsId.push(id);
                        }
                    }
                    // ingsId.push(id);
                }
                console.log('ingsId in ifexing: ', ingsId); //ing id of included ings

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

                // toFindDuplicates(rIds);
                // let cVal = Object.values(counts);
                // let mx = Math.max(...cVal);
                
                // for (let index = mx; index > 0; --index) {
                //     let matched = Object.keys(counts).filter(function(key) {
                //         return counts[key] === index;
                //     });
                //     matched.forEach(m => {
                //         let pint = parseInt(m);
                //         finalRids.push(pint);
                //     });
                // }

                toFindDuplicates(rIds);
                let cVal = Object.values(counts);
                let mx = Math.max(...cVal);
                console.log('max match: ', mx);
                for (let index = mx; index >= 2; --index) {
                    let matched = Object.keys(counts).filter(function(key) {
                        return counts[key] === index;
                    });
                    console.log('matched: ', matched);
                    matched.forEach(m => {
                        let pint = parseInt(m);
                        finalRids.push(pint);
                    });
                }

                console.log('before session if in exings');
                console.log(finalRids);
                if (finalRids.length == 0) {
                    conn.release();
                    req.flash('msg', "No recipes found given the inclusion and exclusion of ingredients!");
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
                                res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, recCateg: recCateg, recRate: recRate, recRateCount: recRateCount, msg, id: session.userName});
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
    
                        res.render('recommendResults', {title: 'Recommended Recipes', ings: recomm.getIngs(), exIngs: recomm.getExIngs(), recName: recName, recId: recId, recImage: recImage, recCateg: recCateg, recRate: recRate, recRateCount: recRateCount, msg, id: ''});
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
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    let id = req.params.id;
                    conn.query('SELECT user_ratedRecs FROM users WHERE user_id = ?', [session.userId], (err, rated) =>{
                        if (err) {
                            console.log(err);  
                            conn.release(); 
                        } else {
                            let getRated = rated[0].user_ratedRecs;
                            if(getRated === null){
                                getRated = '';
                            }
                            getRated += id.toString() + '/';

                            conn.query('UPDATE users SET user_ratedRecs = ? WHERE user_id = ?', [getRated, session.userId], (err, row) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let rate = req.body.userRate;
                                    let recCount = req.body.ratingCount
                                    if(recCount === null){
                                        recCount = 0;
                                    }
                                    let count = parseInt(recCount);
                                    count += 1;
                                    conn.query('UPDATE rec SET rec_rate = ?, rec_rateCount = ? WHERE rec_id = ?', [rate, count, id], (err, row) => {
                                        if(err){
                                            console.log(err);
                                            conn.release();
                                        }
                                        else{
                                            console.log('scount',count);
                                            conn.query('SELECT * FROM saved WHERE rec_id =?', [id], (err, save) => {
                                                if (err) {
                                                    console.log(err);
                                                    conn.release();
                                                } else {
                                                    let row = save[0];
                                                    if (row) {
                                                        conn.query('UPDATE saved SET rec_rate = ?, rec_rateCount = ? WHERE rec_id = ?', [rate, count, id], (err, row) => {
                                                            if(err){
                                                                console.log(err);
                                                                conn.release();
                                                            }
                                                            else{
                                                                conn.release();
                                                                req.flash('msg', 'Recipe successfully rated!');
                                                                res.redirect('/recipes/' + id);
                                                            }
                                                        })
                                                    }
                                                    else{
                                                        conn.release();
                                                        req.flash('msg', 'Recipe successfully rated!');
                                                        res.redirect('/recipes/' + id);
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                        }
                    })
                    
                }
            })
        }else{
            req.flash('msg', 'You need to login to rate the recipe!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSaveRec = (req, res) =>{
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                let userid = req.session.userId;
                let id = req.body.recID;
                let name = req.body.recName;
                let desc = req.body.recDesc;
                let categ = req.body.recCateg;
                let time = req.body.recTime;
                let serving = req.body.recServing;
                let src = req.body.recSrc;
                let vid = req.body.recVid;
                let cal = req.body.recCal;
                let pr = req.body.recProcess;
                let mealTime = req.body.recMealtime;
                let img = req.body.recImg;
                let rate = req.body.recRate;
                let rateCount = req.body.recRateCount;
                console.log(rateCount);
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, saved) =>{
                        if (err) {
                            console.log(err);   
                            conn.release();
                        } else {
                            let getSaved = saved[0].user_Saved;
                            if(getSaved === null){
                                getSaved = '';
                            }
                            getSaved += id.toString() + '/';

                            conn.query('UPDATE users SET user_Saved = ? WHERE user_id = ?', [getSaved, session.userId], (err, row) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    // console.log(rec_id);
                                    conn.query('INSERT INTO saved(user_id, rec_id, rec_name, rec_desc, rec_process, rec_categ, rec_time, rec_serving, rec_src, rec_vid, rec_cal, rec_mealTime, rec_img, rec_rate, rec_rateCount) VALUE(?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?)', [userid, id, name, desc, pr, categ, time, serving, src, vid, cal, mealTime, img, rate, rateCount], (err, row) => {
                                        if(err){
                                            console.log(err);
                                            conn.release();
                                        }
                                         else{
                                            conn.query('INSERT IGNORE INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) SELECT recId, ingId, ingQuant, ingUnit, ingIns FROM recing WHERE recId = ?', [id], (err, row) => {
                                                if(err){
                                                    console.log(err);
                                                    conn.release();
                                                } else{
                                                    conn.release();
                                                    req.flash('msg', 'Recipe successfully saved!');
                                                    res.redirect('/recipes/' + id); 
                                                }
                                            })

                       
                                        }
                                    })
                                }
                            })

                        }
                    })
                    
                }
            })
        }else{
            req.flash('msg', 'You need to login to save the recipe!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSavedRecipes = (req, res) =>{
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM saved WHERE user_id = ?',[session.userId], (err, save) => {
                        if (err) {
                            console.log(err);  
                            conn.release(); 
                        } else {
                            let msg = req.flash('msg');
                            conn.release();
                            res.render('saved', { title: 'Recipes', save: save, id: session.userName, msg});
                        }
                    })
                   
                }})
        }
        else{
            req.flash('msg', 'You need to login to view Saved Recipes!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSavedRView = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if(err){
                console.log('error in user recipes...\n');
                conn.release();
            }
            else{
                let rId = req.params.id;
                conn.query('SELECT * FROM saved WHERE rec_id = ?',[rId], (err, save) => {
                    if(err){
                        console.log('cannot fetch recipes in db...\n');
                        conn.release();
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
                        let qStr = 'SELECT saved_recing.*, ing_name FROM `saved_recing` INNER JOIN ing ON saved_recing.ingId=ing.ing_id WHERE saved_recing.rec_id = ?';;
                        function getIngs(id){
                            return new Promise((resolve, reject) => {
                                conn.query(qStr, [id], (err, ings) => {
                                    if(err){
                                        console.log(err, '\n');
                                        conn.release();
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
                        
                        async function getAllRecIng(save){
                            for(id of save){
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
                            let msg = req.flash('msg');
                            session = req.session;
                            let isRated = false;
                            let isSaved = false;
                            let isMeal = false;
                            // let ratedArr = [];
                            if(session.userId){
                                conn.query('SELECT user_ratedRecs, user_Saved, user_mealPlan FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                    if(err){
                                        console.log(err);
                                        conn.release();
                                    }
                                    else{
                                        let getRated = rated[0].user_ratedRecs;
                                        let getMeal = rated[0].user_mealPlan;
                                        if(getRated){
                                            let ratedArr = getRated.split('/');
                                            if(ratedArr.includes(rId)){
                                                isRated = true;
                                            }
                                        }
                                        if(getMeal){
                                            let mealArr = getMeal.split('/');
                                            if(mealArr.includes(rId)){
                                                isMeal= true;
                                                console.log('isMeal');
                                            }
                                        }
                                        conn.release();
                                        res.render('userSavedRView', { save: save, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: session.userName, isRated: isRated, isSaved: isSaved, isMeal: isMeal});
                                    }
                                })
                                

                            }
                            else{
                                conn.release();
                                res.render('userSavedRView', { save: save, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: '', isRated: isRated, isSaved: '', isMeal: ''});
                            }
                            
                        }
                        getAllRecIng(save);
                    }
                })
                         
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.userSavedEdit = (req, res) => {
    try {
        let rId = req.params.id;
        pool.getConnection((err, conn) => {
            if(err){
                console.log(err, '\n');
                conn.release();   
            }
            else{
                conn.query('SELECT * FROM saved WHERE rec_id = ?', [rId], (err, row) =>{
                    if(err){
                        console.log(err, '\n');
                        conn.release();  
                    }
                    else{
                        //console.log(row);
                        conn.query('SELECT saved_recing.*, ing_name FROM `saved_recing` INNER JOIN ing ON saved_recing.ingId=ing.ing_id WHERE rec_id = ?',[rId], (err, ingRow) =>{
                            if(err){
                                console.log(err, '\n');
                                conn.release();  
                            }
                            else{
                                conn.release();
                                res.render('userSavedEdit', {title: 'Edit Recipe', save: row, ing: ingRow});
                            }
                        }) 
                    }  
                })
            }
        })
        }
     catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.userSavedSubEdit = (req,res) => { 
    try {
        session = req.session;
        pool.getConnection((err, conn)=>{
            if(err){
                console.log(err, '\n');
                conn.release();
            }
            else{
                let rId = req.params.id;
                let rec = new Recipe.Recipe();
                rec.name = req.body.recNameInp;
                rec.desc = req.body.recDescInp;
                rec.prc = req.body.recPrcInp;
                rec.categ = req.body.recCateg;
                rec.time = req.body.recTimeInp;
                rec.srv = req.body.recSrvInp;
                rec.src = req.body.recSrcInp;
                rec.vid = req.body.recVidInp;
                rec.cal = req.body.recCalInp;
                rec.mTime = req.body.recMTimeInp;
                let mString = '';
                if(Array.isArray(rec.getRecMTime())){
                    rec.getRecMTime().forEach(time => {
                        mString += time + ', ';
                    });
                }else{
                    mString = rec.getRecMTime();
                }
                conn.query('UPDATE `saved` SET `rec_name`= ?,`rec_desc`= ?,`rec_process`= ?,`rec_categ`= ?,`rec_time`= ? ,`rec_serving`= ?,`rec_src`= ?,`rec_vid`= ?,`rec_cal`= ?,`rec_mealTime`= ? WHERE rec_id = ?', [rec.getRecName(), rec.getRecDesc(), rec.getRecPrc(), rec.getRecCateg(), rec.getRecTime(), rec.getRecSrv(), rec.getRecSrc(), rec.getRecVid(), rec.getRecCal(), mString, rId], (err, save) => {
                    if(err){
                        console.log(err, '\n');
                        conn.release();
                    }
                    else{
                        conn.query('DELETE FROM saved_recing WHERE rec_id = ?', [rId], (err, row) =>{
                            if(err){
                                console.log(err, '\n');
                                conn.release();
                            }
                            else{ 

                        let ing = new Recipe.Ing();
                        let ingNum = req.body.ingNum;
                        ing.quant = JSON.parse(req.body.qval);
                        ing.name = JSON.parse(req.body.idval);
                        ing.unit = JSON.parse(req.body.uval);
                        ing.ins = JSON.parse(req.body.insval);

                        function insertNewIng(ingName){
                            return new Promise((resolve, reject) => {
                                conn.query('INSERT INTO ing(ing_name) VALUES (?)', [ingName],(err, ins) =>{
                                    if(err){
                                        console.log(err, '\n');
                                        conn.release();
                                    } else{
                                        let ii = ins.insertId;
                                        resolve(ii);
                                    }
                                });
                            })
                        }
                        async function insertRecIng(ingName, qf, ingUnit, ingIns){
                            const ii = await insertNewIng(ingName);
                            conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [rId, ii, qf, ingUnit, ingIns], (err, row) => {
                                if(err){
                                    console.log(err, '\n');
                                    conn.release();
                                }
                                else{
                                    console.log('new ing added + recing inserted...\n');
                                }
                            })
                            
                        }

                        for(let z = 0; z < ingNum; z++){
                            let ingQuant = ing.getIngQuant()[z];
                            let ingUnit = ing.getIngUnit()[z];
                            let ingName = ing.getIngName()[z];
                            let ingIns = ing.getIngIns()[z];
                            let qf; 
                            if(parseFloat(ingQuant)){
                                qf = parseFloat(ingQuant);
                            }
                            else{
                                qf = 0;
                            }

                            conn.query('SELECT * FROM ing WHERE ing_name = ?', [ingName], (err, rows) =>{
                                if(err){
                                    console.log(err, '\n');
                                    conn.release();
                                }
                                else if(rows[0]){
                                    let ii = rows[0].ing_id;
                                    conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [rId, ii, qf, ingUnit, ingIns], (err, row) => {
                                        if(err){
                                            console.log(err, '\n');
                                            conn.release();
                                        }
                                        else{
                                            console.log('recing added...\n');
                                        }
                                    })
                                }
                                else{
                                    insertRecIng(ingName, qf, ingUnit, ingIns);
                                }
                            })
                        }
                        conn.release();
                        res.redirect('/saved');
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
        res.json({ message: error.message });
    }
}

exports.userSavedDelete = (req, res) => {
    try{
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                let id = req.params.id;
                conn.query('DELETE FROM saved where rec_id =?', [id], (err, result) => {
                    if(err){
                        console.log('not deleted');
                        conn.release();
                        res.redirect('/saved'); 
                    }
                    else{
                        conn.query('DELETE FROM saved_recing WHERE rec_id =?', [id]);
                        //conn.query('DELETE user_Saved FROM user WHERE rec_id LIKE ?', [id]);
                        conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, saved) => {
                            if(err){
                                console.log(err);
                                conn.release();
                            }
                            else{
                                let getSaved = saved[0].user_Saved;
                                if(getSaved){
                                    let savedArr = getSaved.split('/');
                                    if (savedArr.includes(id)) {
                                        for(let i = 0; i < savedArr.length; i++){ 
                                            if (savedArr[i] === id) { 
                                                savedArr.splice(i, 1); 
                                            }
                                        }
                                    }
                                    conn.query('UPDATE users SET user_Saved = ?', [savedArr]);
                                    console.log(id);
                                    console.log('deleted');
                                }
                            }
                        })
                        conn.release();
                        res.redirect('/saved'); 
                    }
                })
            })
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
}

exports.userRecipes = (req, res) =>{
    try {
        function getRec(conn, name) {
            conn.query('SELECT * FROM rec', (err, recs) => {
                if (err) {
                    console.log(err);   
                    conn.release();
                } else {
                    conn.release();
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
                        conn.release(); 
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            } else {
                conn.query('SELECT * FROM rec ORDER BY rec_name DESC', (err, recs) =>{
                    if (err) {
                        console.log(err);  
                        conn.release(); 
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
                        conn.release();
                    } else {
                        conn.release();
                        res.render('userRecipes', { title: 'Recipes', recs: recs, id: name});
                    }
                })
            } else {
                conn.query('SELECT * FROM rec ORDER BY rec_rate', (err, recs) =>{
                    if (err) {
                        console.log(err); 
                        conn.release();  
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
                conn.release();
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
                conn.release();
            }
            else{
                conn.query('SELECT ing_name FROM ing WHERE ing_name LIKE ? ORDER BY ing_name LIMIT 5',[req.body.ing + '%'], (err, ings) =>{
                    if(err){
                        console.log(err);
                        conn.release();
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
                    conn.release();
                }
                else{
                    conn.query('SELECT * FROM users WHERE user_id = ?', [session.userId], (err, user) => {
                        if(err){
                            console.log(err);
                            conn.release();
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
                    conn.release();
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
                            conn.release();
                        } else {
                            conn.release();
                            req.flash('msg', 'Profile successfully updated!');
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
                            conn.release();
                        } else {
                            conn.query('SELECT user_grocery FROM users WHERE user_id = ?', [session.userId], (err, rows) => {
                                if (err) {
                                    console.log(err);    
                                    conn.release();   
                                } 
                                else {
                                    let gListStr = rows[0].user_grocery;
                                    if(gListStr){
                                        resolve(gListStr);
                                    }
                                    else{
                                        resolve('');
                                    }
                                    
                                }
                            })
                        }
                    })
                })
            }
            async function renderPage() {
                let gListArr = [];
                let grocery = new Recipe.Grocery();
                grocery.item = await getGList();
                gListArr = grocery.item.split('/');

                let msg = req.flash('msg');
                res.render('grocery', {msg, id: session.userName, list: gListArr});
            }

            renderPage();
        }
        else{
            req.flash('msg', 'You need to login to view Grocery Lists!');
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
            let recId;
            let mealPlanRecId;
            let grocery = new Recipe.Grocery();
            let gListStr = '';
            let ingStringArr = [];

            function getIngs(mealPlanRecId, conn) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT recing.*, ing_name FROM `recing` INNER JOIN ing ON recing.ingId=ing.ing_id WHERE recing.recId = ?', [mealPlanRecId], (err, ings) => {
                        if (err) {
                            console.log('err in q: ', err);
                            conn.release();
                        } else {
                            ings.forEach(ing => {
                                let ingq = ing.ingQuant;
                                let ingu = ing.ingUnit;
                                let temp = '';
                                
                                if(!ing.ingQuant){
                                    ingq = '';
                                }
                                if(!ing.ingUnit){
                                    ingu = '';
                                }
                                temp = ingq + ' ' + ingu + ' ' + ing.ing_name;
                                ingStringArr.push(temp.trim());
                            });
                            
                            // conn.release();
                            console.log('arr: ', ingStringArr);
                            ingStringArr.forEach(g => {
                                // console.log(g);
                                gListStr += g + '/';
                            });
                            resolve(gListStr);
                        }
                    })
                })
            }
            async function ingWait(id, conn) {
                let str = await getIngs(id, conn);
                console.log('str: ', str);
            }
            function updateGList(str, conn){
                conn.query('UPDATE `users` SET `user_grocery`= ? WHERE user_id = ?', [str, session.userId], (err, row) =>{
                    if (err) {
                        console.log(err);
                        conn.release();
                    } else {
                        conn.release();
                        req.flash('msg', 'Ingredients added to your Grocery List!');
                        if(mealPlanRecId){
                            res.redirect('/mealPlan');
                        }
                        if(recId){
                            // res.redirect('/recipes/' + recId);
                            res.redirect('back');
                        }
                        
                    }
                })
            }
            pool.getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                    conn.release();
                } else {
                    if(req.body.recId){
                        recId = req.body.recId;
                        grocery.item = JSON.parse(req.body.gList);
                        if(Array.isArray(grocery.getItem())){
                            grocery.getItem().forEach(g => {
                                gListStr += g + '/';
                            });
                        }
                        else{
                            gListStr = grocery.getItem();
                        }
                    }
                    if(req.body.mealPlanRecId){
                        mealPlanRecId = req.body.mealPlanRecId
                        console.log(mealPlanRecId);
                        ingWait(mealPlanRecId, conn)
                    }
                    console.log('after ifs ', gListStr);
                    conn.query('SELECT user_grocery FROM users WHERE user_id = ?', [session.userId], (err, row) =>{
                        if (err) {
                            console.log(err);
                            conn.release();
                        } else {
                            console.log('glist inside select: ', gListStr);
                            let listStr = row[0].user_grocery;
                            if(listStr){
                                listStr += gListStr + '/';
                                updateGList(listStr, conn);
                            }
                            else{
                                updateGList(gListStr, conn);
                            }
                        }
                    })
                }
            })

        }
        else{
            req.flash('msg', 'You need to log in first!');
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
                    conn.release();
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
                                conn.release();
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
                                conn.release();
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
            req.flash('msg', 'You need to log in first!');
            res.redirect('/login');
        }
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.getFilter = (req,res) => {
    try{
        function timeFilter (conn, mealTime){
            if (mealTime === "30"){
                conn.query('SELECT * FROM rec WHERE rec_time IN (0,15, 16, 17, 18 ,19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30)  ORDER BY rec_time ASC;', [mealTime],(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(mealTime);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
            else if(mealTime === "31"){
                conn.query('SELECT * FROM rec WHERE rec_time IN (40, 41, 42, 43, 44,45,47,48,49,50,55,56,57,58,59, "1 hr%")  ORDER BY rec_time ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(mealTime);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
            else if(mealTime ==="1 hr and 30 minutes"){
                conn.query('SELECT * FROM rec WHERE rec_time LIKE "1 h%" ORDER BY rec_time ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(mealTime);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
            else if (mealTime ==="1 hr and 31 minutes"){
                conn.query('SELECT * FROM rec WHERE rec_time >= "1 hour and 3% minutes" ORDER BY rec_time ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(mealTime);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
        };
        function calorieFilter(conn, calorie){
            if(calorie==="400"){
                conn.query('SELECT * FROM rec WHERE rec_cal BETWEEN 100 AND 400 ORDER BY rec_cal ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(calorie);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
        else if(calorie==="800"){
                conn.query('SELECT * FROM rec WHERE rec_cal BETWEEN 401 AND 800 ORDER BY rec_cal ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(calorie);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
        else if(calorie==="801"){
                conn.query('SELECT * FROM rec WHERE rec_cal BETWEEN 801 AND 1200 ORDER BY rec_cal ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(calorie);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
        else if(calorie==="1201"){
                conn.query('SELECT * FROM rec WHERE rec_cal > 1201 ORDER BY rec_cal ASC;',(err, filter) =>{
                    if(err){
                        console.log(err);
                        conn.release();
                    }else{
                        let isSaved = false;
                        let recid = filter.rec_id;
                        console.log(calorie);
                        session = req.session;
                        if(session.userId){
                            conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let getSaved = rated[0].user_Saved;
                                    if(getSaved){
                                        let savedArr = getSaved.split('/');
                                        if(savedArr.includes(recid)){
                                            isSaved= true;
                                            console.log('isSaved');
                                        }
                                    }
                                    conn.release();
                                    res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                }
                            })
                        }
                        else{
                            conn.release();
                            res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                    }}
                }) 
            }
        };
        let dishType = req.body.recDishInp || 0;
        let categoryRec = req.body.recCateg || 0;
        let mealTime = req.body.recTimeInp || 0;
        let calorie = req.body.recCal || 0;
        console.log('filtering..');
        console.log(mealTime);
        pool.getConnection((err,conn) =>{
            if(err){
                console.log(err);
            }
            else{
                if(mealTime){
                    timeFilter(conn, mealTime);
                }
                else if(calorie){
                    calorieFilter(conn, calorie);
                }
                else{
                    conn.query('SELECT * FROM rec WHERE rec_mealTime LIKE ? OR rec_categ LIKE ? OR rec_time LIKE ? OR rec_cal LIKE ?', ['%' +req.body.recDishInp + '%', '%' + req.body.recCateg + '%', '%' +req.body.recTimeInp + '%', '%' + req.body.recCal + '%'], (err, filter) =>{
                        if(err){
                            console.log(err);
                            conn.release();
                        }else{
                            console.log(dishType);
                            console.log(categoryRec);
                            console.log(mealTime);
                            console.log(calorie);
                            session = req.session;
                            let isSaved = false;
                            let recid = filter.rec_id;
                            if(session.userId){
                                conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                    if(err){
                                        console.log(err);
                                        conn.release();
                                    }
                                    else{
                                        let getSaved = rated[0].user_Saved;
                                        if(getSaved){
                                            let savedArr = getSaved.split('/');
                                            if(savedArr.includes(recid)){
                                                isSaved= true;
                                                console.log('isSaved');
                                            }
                                        }
                                        conn.release();
                                        res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: session.userName, isSaved: isSaved});
                                    }
                                })
                            }
                            else{
                                conn.release();
                                res.render('userSearchResults', {title: 'Filter Results', recs: filter, id: '', isSaved: ''});
                        }}
                    })
                }
            }
        })
    }catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.mealPlan = (req, res) =>{
    Date.prototype.getWeek = function() {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        var week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks from date to week1.
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    let id = req.body.recID;
                    conn.query('SELECT user_mealPlan FROM users WHERE user_id = ?', [session.userId], (err, mealPlan) =>{
                        if (err) {
                            console.log(err);   
                            conn.release();
                        } else {
                            let getmeal = mealPlan[0].user_mealPlan;
                            if(getmeal === null){
                                getmeal = '';
                            }
                            getmeal += id + '/';

                            conn.query('UPDATE users SET user_mealPlan = ? WHERE user_id = ?', [getmeal, session.userId], (err, row) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    let dateTime = req.body.datetimes;
                                    let date = new Date(dateTime);
                                    let rec = new Recipe.Recipe();
                                    let userid = req.session.userId;
                                    let id = req.body.recID;
                                    let mon = String(date.getMonth());
                                    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                    let month = months[date.getMonth()];
                                    let day = date.getDate();
                                    let day1 = String(date.getDate());
                                    let dayMonth = day1 + mon;
                                    let sDay = days[date.getDay()];
                                    let week = date.getWeek();
                                    let hr = date.getHours();
                                    let ampm = "am";
                                    if( hr > 12 ) {
                                        hr -= 12;
                                        ampm = "pm";
                                    }
                                    let min = date.getMinutes();
                                    if (min < 10) {
                                        min = "0" + min;
                                    }
                                    let time = hr + ":" + min + ampm;
                                    console.log(month, day, sDay, time, date, week, dayMonth);
                                    conn.query('INSERT INTO mealPlan(user_id, rec_id, month, day, time, sDay, weekCount, dateTime, dayMonth) VALUE(?,?,?,?,?,?,?,?,?)', [req.session.userId, id, month, day, time, sDay, week, dateTime, dayMonth], (err, row) => {
                                    if(err){
                                        console.log(err);
                                        conn.release();
                                    }
                                    else{
                                        conn.release();
                                        req.flash('msg', 'Recipe successfully saved to your Meal Plan!');
                                        res.redirect('/recipes/' + id); 
                                    }
                                    })
                                    // conn.release();
                                }
                            })

                        }
                    })
                    
                }
            })
        }else{
            req.flash('msg', 'You need to login to add the recipe to your Meal Plan!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.mealPlanRec = (req, res) =>{
    try {
        pool.getConnection((err, conn) => {
            if (err){
                console.log(err);
                conn.release();
            }
            else{
                let mrecName = [];
                let mrecId = [];
                let mrecImage = [];
                let mrecCateg = [];
                let mrecRate = [];
                let mrecRateCount = [];
                let trecName = [];
                let trecId = [];
                let trecImage = [];
                let trecCateg = [];
                let trecRate = [];
                let trecRateCount = [];
                let wrecName = [];
                let wrecId = [];
                let wrecImage = [];
                let wrecCateg = [];
                let wrecRate = [];
                let wrecRateCount = [];
                let threcName = [];
                let threcId = [];
                let threcImage = [];
                let threcCateg = [];
                let threcRate = [];
                let threcRateCount = [];
                let frecName = [];
                let frecId = [];
                let frecImage = [];
                let frecCateg = [];
                let frecRate = [];
                let frecRateCount = [];
                let srecName = [];
                let srecId = [];
                let srecImage = [];
                let srecCateg = [];
                let srecRate = [];
                let srecRateCount = [];
                let surecName = [];
                let surecId = [];
                let surecImage = [];
                let surecCateg = [];
                let surecRate = [];
                let surecRateCount = [];
                let date = new Date();
                session = req.session;

                Date.prototype.getWeek = function() {
                    var date = new Date(this.getTime());
                    date.setHours(0, 0, 0, 0);
                    // Thursday in current week decides the year.
                    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                    // January 4 is always in week 1.
                    var week1 = new Date(date.getFullYear(), 0, 4);
                    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                };

                let dateC = date.getWeek();

                function monday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Monday"',[dateC, session.userId], (err, monday) =>{
                            if(err){
                                console.log(err)
                            }
                            else {
                                for(let i = 0; i< monday.length; i++){
                                    let id = monday[i].rec_id;
                                    let name = monday[i].rec_name;
                                    let image = monday[i].rec_image;
                                    let categ = monday[i].rec_categ;
                                    let rate = monday[i].rec_rate;
                                    let count = monday[i].rec_rateCount;
                                    mrecName.push(name);
                                    mrecId.push(id);
                                    mrecImage.push(image);
                                    mrecCateg.push(categ);
                                    mrecRate.push(rate);
                                    mrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function tuesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Tuesday"',[dateC, session.userId], (err, tuesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< tuesday.length; i++){
                                    let id = tuesday[i].rec_id;
                                    let name = tuesday[i].rec_name;
                                    let image = tuesday[i].rec_image;
                                    let categ = tuesday[i].rec_categ;
                                    let rate = tuesday[i].rec_rate;
                                    let count = tuesday[i].rec_rateCount;
                                    trecName.push(name);
                                    trecId.push(id);
                                    trecImage.push(image);
                                    trecCateg.push(categ);
                                    trecRate.push(rate);
                                    trecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function wednesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Wednesday"',[dateC, session.userId], (err, wednesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< wednesday.length; i++){
                                    let id = wednesday[i].rec_id;
                                    let name = wednesday[i].rec_name;
                                    let image = wednesday[i].rec_image;
                                    let categ = wednesday[i].rec_categ;
                                    let rate = wednesday[i].rec_rate;
                                    let count = wednesday[i].rec_rateCount;
                                    wrecName.push(name);
                                    wrecId.push(id);
                                    wrecImage.push(image);
                                    wrecCateg.push(categ);
                                    wrecRate.push(rate);
                                    wrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function thursday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Thursday"',[dateC, session.userId], (err, thursday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< thursday.length; i++){
                                    let id = thursday[i].rec_id;
                                    let name = thursday[i].rec_name;
                                    let image = thursday[i].rec_image;
                                    let categ = thursday[i].rec_categ;
                                    let rate = thursday[i].rec_rate;
                                    let count = thursday[i].rec_rateCount;
                                    threcName.push(name);
                                    threcId.push(id);
                                    threcImage.push(image);
                                    threcCateg.push(categ);
                                    threcRate.push(rate);
                                    threcRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function friday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Friday"',[dateC, session.userId], (err, friday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< friday.length; i++){
                                    let id = friday[i].rec_id;
                                    let name = friday[i].rec_name;
                                    let image = friday[i].rec_image;
                                    let categ = friday[i].rec_categ;
                                    let rate = friday[i].rec_rate;
                                    let count = friday[i].rec_rateCount;
                                    frecName.push(name);
                                    frecId.push(id);
                                    frecImage.push(image);
                                    frecCateg.push(categ);
                                    frecRate.push(rate);
                                    frecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function saturday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Saturday"',[dateC, session.userId], (err, saturday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< saturday.length; i++){
                                    let id = saturday[i].rec_id;
                                    let name = saturday[i].rec_name;
                                    let image = saturday[i].rec_image;
                                    let categ = saturday[i].rec_categ;
                                    let rate = saturday[i].rec_rate;
                                    let count = saturday[i].rec_rateCount;
                                    srecName.push(name);
                                    srecId.push(id);
                                    srecImage.push(image);
                                    srecCateg.push(categ);
                                    srecRate.push(rate);
                                    srecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function sunday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Sunday"',[dateC, session.userId], (err, sunday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< sunday.length; i++){
                                    let id = sunday[i].rec_id;
                                    let name = sunday[i].rec_name;
                                    let image = sunday[i].rec_image;
                                    let categ = sunday[i].rec_categ;
                                    let rate = sunday[i].rec_rate;
                                    let count = sunday[i].rec_rateCount;
                                    surecName.push(name);
                                    surecId.push(id);
                                    surecImage.push(image);
                                    surecCateg.push(categ);
                                    surecRate.push(rate);
                                    surecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                async function getMealPlan(){
                    let mondayrec = await monday();
                    let tuerec = await tuesday();
                    let wedrec = await wednesday();
                    let thursrec = await thursday();
                    let frirec = await friday();
                    let satrec = await saturday();
                    let sunrec = await sunday();
                    console.log(mondayrec);

                    let msg = req.flash('msg');
                    conn.release();
                    res.render('mealPlan', {title: 'MealPlan', mrecName: mrecName, mrecId: mrecId, mrecImage: mrecImage, mrecCateg: mrecCateg, mrecRate: mrecRate, mrecRateCount: mrecRateCount, trecName: trecName, trecId: trecId, trecImage: trecImage, trecCateg: trecCateg, trecRate: trecRate, trecRateCount: trecRateCount, wrecName: wrecName, wrecId: wrecId, wrecImage: wrecImage, wrecCateg: wrecCateg, wrecRate: wrecRate, wrecRateCount: wrecRateCount, threcName: threcName, threcId: threcId, threcImage: threcImage, threcCateg: threcCateg, threcRate: threcRate, threcRateCount: threcRateCount, frecName: frecName, frecId: frecId, frecImage: frecImage, frecCateg: frecCateg, frecRate: frecRate, frecRateCount: frecRateCount, srecName: srecName, srecId: srecId, srecImage: srecImage, srecCateg: srecCateg, srecRate: srecRate, srecRateCount: srecRateCount, surecName: surecName, surecId: surecId, surecImage: surecImage, surecCateg: surecCateg, surecRate: surecRate, surecRateCount: surecRateCount, msg, id: session.userName});
                }
                if(session.userId){
                    getMealPlan();
                }
                else{
                    req.flash('msg', 'You need to login to view Meal Plan Recipes!')
                    res.redirect('/login');
                }
            }
        })  
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.mealPlanRecView = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if(err){
                console.log('error in user recipes...\n');
                conn.release();
            }
            else{
                let rId = req.params.id;
                conn.query('SELECT * FROM rec WHERE rec_id = ?',[rId], (err, recs) => {
                    if(err){
                        console.log('cannot fetch recipes in db...\n');
                        conn.release();
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
                            let msg = req.flash('msg');
                            session = req.session;
                            let isRated = false;
                            let isSaved = false;
                            // let ratedArr = [];
                            if(session.userId){
                                conn.query('SELECT user_ratedRecs, user_Saved, user_mealPlan FROM users WHERE user_id = ?', [session.userId], (err, rated) => {
                                    if(err){
                                        console.log(err);
                                        conn.release();
                                    }
                                    else{
                                        let getRated = rated[0].user_ratedRecs;
                                        let getSaved = rated[0].user_Saved;
                                        if(getRated){
                                            let ratedArr = getRated.split('/');
                                            if(ratedArr.includes(rId)){
                                                isRated = true;
                                            }
                                        }
                                        if(getSaved){
                                            let savedArr = getSaved.split('/');
                                            if(savedArr.includes(rId)){
                                                isSaved= true;
                                                console.log('isSaved');
                                            }
                                        }
                                        conn.release();
                                        res.render('mealPlanRecView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: session.userName, isRated: isRated, isSaved: isSaved});
                                    }
                                })
                                

                            }
                            else{
                                conn.release();
                                res.render('mealPlanRecView', { recs: recs, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: '', isRated: isRated, isSaved: ''});
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

exports.mealPlanRecDelete = (req, res) => {
    try{
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                let id = req.params.id;
                conn.query('DELETE FROM mealPlan where rec_id =? AND user_id =?', [id, session.userId], (err, result) => {
                    if(err){
                        console.log('not deleted');
                        conn.release();
                        res.redirect('/mealplan'); 
                        // conn.release();
                    }
                    else{
                        //conn.query('DELETE user_mealPlan FROM user WHERE rec_id LIKE ?', [id]);
                        conn.query('SELECT user_mealPlan FROM users WHERE user_id = ?', [session.userId], (err, mealPlan) => {
                            if(err){
                                console.log(err);
                                conn.release();
                            }
                            else{
                                let getmeal = mealPlan[0].user_mealPlan;
                                if(getmeal){
                                    let mealArr = getmeal.split('/');
                                    if (mealArr.includes(id)) {
                                        for(let i = 0; i < mealArr.length; i++){ 
                                            if (mealArr[i] === id) { 
                                                mealArr.splice(i, 1); 
                                            }
                                        }
                                    }
                                    conn.query('UPDATE users SET user_mealPlan = ?', [mealArr]);
                                    console.log(id);
                                    console.log('deleted');
                                }
                            }
                        })
                        conn.release();
                        res.redirect('/mealplan'); 
                    }
                })
            })
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
}

exports.mealPlanCurrentBut = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if (err){
                console.log(err);
                conn.release();
            }
            else{
                let mrecName = [];
                let mrecId = [];
                let mrecImage = [];
                let mrecCateg = [];
                let mrecRate = [];
                let mrecRateCount = [];
                let trecName = [];
                let trecId = [];
                let trecImage = [];
                let trecCateg = [];
                let trecRate = [];
                let trecRateCount = [];
                let wrecName = [];
                let wrecId = [];
                let wrecImage = [];
                let wrecCateg = [];
                let wrecRate = [];
                let wrecRateCount = [];
                let threcName = [];
                let threcId = [];
                let threcImage = [];
                let threcCateg = [];
                let threcRate = [];
                let threcRateCount = [];
                let frecName = [];
                let frecId = [];
                let frecImage = [];
                let frecCateg = [];
                let frecRate = [];
                let frecRateCount = [];
                let srecName = [];
                let srecId = [];
                let srecImage = [];
                let srecCateg = [];
                let srecRate = [];
                let srecRateCount = [];
                let surecName = [];
                let surecId = [];
                let surecImage = [];
                let surecCateg = [];
                let surecRate = [];
                let surecRateCount = [];
                let date = new Date();
                session = req.session;

                Date.prototype.getWeek = function() {
                    var date = new Date(this.getTime());
                    date.setHours(0, 0, 0, 0);
                    // Thursday in current week decides the year.
                    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                    // January 4 is always in week 1.
                    var week1 = new Date(date.getFullYear(), 0, 4);
                    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                };

                let dateC = date.getWeek();

                function monday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Monday"',[dateC, session.userId], (err, monday) =>{
                            if(err){
                                console.log(err)
                            }
                            else {
                                for(let i = 0; i< monday.length; i++){
                                    let id = monday[i].rec_id;
                                    let name = monday[i].rec_name;
                                    let image = monday[i].rec_image;
                                    let categ = monday[i].rec_categ;
                                    let rate = monday[i].rec_rate;
                                    let count = monday[i].rec_rateCount;
                                    mrecName.push(name);
                                    mrecId.push(id);
                                    mrecImage.push(image);
                                    mrecCateg.push(categ);
                                    mrecRate.push(rate);
                                    mrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function tuesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Tuesday"',[dateC, session.userId], (err, tuesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< tuesday.length; i++){
                                    let id = tuesday[i].rec_id;
                                    let name = tuesday[i].rec_name;
                                    let image = tuesday[i].rec_image;
                                    let categ = tuesday[i].rec_categ;
                                    let rate = tuesday[i].rec_rate;
                                    let count = tuesday[i].rec_rateCount;
                                    trecName.push(name);
                                    trecId.push(id);
                                    trecImage.push(image);
                                    trecCateg.push(categ);
                                    trecRate.push(rate);
                                    trecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function wednesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Wednesday"',[dateC, session.userId], (err, wednesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< wednesday.length; i++){
                                    let id = wednesday[i].rec_id;
                                    let name = wednesday[i].rec_name;
                                    let image = wednesday[i].rec_image;
                                    let categ = wednesday[i].rec_categ;
                                    let rate = wednesday[i].rec_rate;
                                    let count = wednesday[i].rec_rateCount;
                                    wrecName.push(name);
                                    wrecId.push(id);
                                    wrecImage.push(image);
                                    wrecCateg.push(categ);
                                    wrecRate.push(rate);
                                    wrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function thursday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Thursday"',[dateC, session.userId], (err, thursday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< thursday.length; i++){
                                    let id = thursday[i].rec_id;
                                    let name = thursday[i].rec_name;
                                    let image = thursday[i].rec_image;
                                    let categ = thursday[i].rec_categ;
                                    let rate = thursday[i].rec_rate;
                                    let count = thursday[i].rec_rateCount;
                                    threcName.push(name);
                                    threcId.push(id);
                                    threcImage.push(image);
                                    threcCateg.push(categ);
                                    threcRate.push(rate);
                                    threcRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function friday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Friday"',[dateC, session.userId], (err, friday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< friday.length; i++){
                                    let id = friday[i].rec_id;
                                    let name = friday[i].rec_name;
                                    let image = friday[i].rec_image;
                                    let categ = friday[i].rec_categ;
                                    let rate = friday[i].rec_rate;
                                    let count = friday[i].rec_rateCount;
                                    frecName.push(name);
                                    frecId.push(id);
                                    frecImage.push(image);
                                    frecCateg.push(categ);
                                    frecRate.push(rate);
                                    frecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function saturday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Saturday"',[dateC, session.userId], (err, saturday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< saturday.length; i++){
                                    let id = saturday[i].rec_id;
                                    let name = saturday[i].rec_name;
                                    let image = saturday[i].rec_image;
                                    let categ = saturday[i].rec_categ;
                                    let rate = saturday[i].rec_rate;
                                    let count = saturday[i].rec_rateCount;
                                    srecName.push(name);
                                    srecId.push(id);
                                    srecImage.push(image);
                                    srecCateg.push(categ);
                                    srecRate.push(rate);
                                    srecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function sunday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Sunday"',[dateC, session.userId], (err, sunday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< sunday.length; i++){
                                    let id = sunday[i].rec_id;
                                    let name = sunday[i].rec_name;
                                    let image = sunday[i].rec_image;
                                    let categ = sunday[i].rec_categ;
                                    let rate = sunday[i].rec_rate;
                                    let count = sunday[i].rec_rateCount;
                                    surecName.push(name);
                                    surecId.push(id);
                                    surecImage.push(image);
                                    surecCateg.push(categ);
                                    surecRate.push(rate);
                                    surecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                async function getMealPlan(){
                    let mondayrec = await monday();
                    let tuerec = await tuesday();
                    let wedrec = await wednesday();
                    let thursrec = await thursday();
                    let frirec = await friday();
                    let satrec = await saturday();
                    let sunrec = await sunday();
                    console.log(mondayrec);

                    let msg = req.flash('msg');
                    conn.release();
                    res.render('mealPlan', {title: 'MealPlan', mrecName: mrecName, mrecId: mrecId, mrecImage: mrecImage, mrecCateg: mrecCateg, mrecRate: mrecRate, mrecRateCount: mrecRateCount, trecName: trecName, trecId: trecId, trecImage: trecImage, trecCateg: trecCateg, trecRate: trecRate, trecRateCount: trecRateCount, wrecName: wrecName, wrecId: wrecId, wrecImage: wrecImage, wrecCateg: wrecCateg, wrecRate: wrecRate, wrecRateCount: wrecRateCount, threcName: threcName, threcId: threcId, threcImage: threcImage, threcCateg: threcCateg, threcRate: threcRate, threcRateCount: threcRateCount, frecName: frecName, frecId: frecId, frecImage: frecImage, frecCateg: frecCateg, frecRate: frecRate, frecRateCount: frecRateCount, srecName: srecName, srecId: srecId, srecImage: srecImage, srecCateg: srecCateg, srecRate: srecRate, srecRateCount: srecRateCount, surecName: surecName, surecId: surecId, surecImage: surecImage, surecCateg: surecCateg, surecRate: surecRate, surecRateCount: surecRateCount, msg, id: session.userName});
                }
                if(session.userId){
                    getMealPlan();
                }
                else{
                    req.flash('msg', 'You need to login to view Meal Plan Recipes!')
                    res.redirect('/login');
                }
            }
        })  
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.mealPlanPastBut = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if (err){
                console.log(err);
                conn.release();
            }
            else{
                let mrecName = [];
                let mrecId = [];
                let mrecImage = [];
                let mrecCateg = [];
                let mrecRate = [];
                let mrecRateCount = [];
                let trecName = [];
                let trecId = [];
                let trecImage = [];
                let trecCateg = [];
                let trecRate = [];
                let trecRateCount = [];
                let wrecName = [];
                let wrecId = [];
                let wrecImage = [];
                let wrecCateg = [];
                let wrecRate = [];
                let wrecRateCount = [];
                let threcName = [];
                let threcId = [];
                let threcImage = [];
                let threcCateg = [];
                let threcRate = [];
                let threcRateCount = [];
                let frecName = [];
                let frecId = [];
                let frecImage = [];
                let frecCateg = [];
                let frecRate = [];
                let frecRateCount = [];
                let srecName = [];
                let srecId = [];
                let srecImage = [];
                let srecCateg = [];
                let srecRate = [];
                let srecRateCount = [];
                let surecName = [];
                let surecId = [];
                let surecImage = [];
                let surecCateg = [];
                let surecRate = [];
                let surecRateCount = [];
                let date = new Date();
                session = req.session;

                function getFirstDay(){
                    let curr = new Date; // get current date
                    let first = curr.getDate() - curr.getDay()-12; // First day is the day of the month - the day of the week
                    console.log(first);
                    let startDate = new Date(curr.setDate(first));
                    console.log(startDate);
                    //startDate = ""+startDate.getFullYear()+"/"+ (startDate.getMonth() + 1) + "/" + startDate.getDate() 
                    startDate = ""+startDate.getDate();
                    
                    return startDate;
                   //alert(startDate+" ,   "+endDate)
                };
                function getLastDay(){
                    let curr = new Date; // get current date
                    let first = curr.getDate() - curr.getDay()-12; // First day is the day of the month - the day of the week
                    let last = first + 5; // last day is the first day + 5
                    let endDate = new Date(curr.setDate(last));
                    //endDate = "" + (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear();
                    endDate = ""+endDate.getDate();
                    return endDate;
                }
            
                let dateC = getFirstDay();
                let dateD = getLastDay();
            

                function monday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Monday"',[dateC, dateD, session.userId], (err, monday) =>{
                            if(err){
                                console.log(err)
                            }
                            else {
                                for(let i = 0; i< monday.length; i++){
                                    let id = monday[i].rec_id;
                                    let name = monday[i].rec_name;
                                    let image = monday[i].rec_image;
                                    let categ = monday[i].rec_categ;
                                    let rate = monday[i].rec_rate;
                                    let count = monday[i].rec_rateCount;
                                    mrecName.push(name);
                                    mrecId.push(id);
                                    mrecImage.push(image);
                                    mrecCateg.push(categ);
                                    mrecRate.push(rate);
                                    mrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function tuesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Tuesday"',[dateC, dateD, session.userId], (err, tuesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< tuesday.length; i++){
                                    let id = tuesday[i].rec_id;
                                    let name = tuesday[i].rec_name;
                                    let image = tuesday[i].rec_image;
                                    let categ = tuesday[i].rec_categ;
                                    let rate = tuesday[i].rec_rate;
                                    let count = tuesday[i].rec_rateCount;
                                    trecName.push(name);
                                    trecId.push(id);
                                    trecImage.push(image);
                                    trecCateg.push(categ);
                                    trecRate.push(rate);
                                    trecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function wednesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Wednesday"',[dateC, dateD, session.userId], (err, wednesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< wednesday.length; i++){
                                    let id = wednesday[i].rec_id;
                                    let name = wednesday[i].rec_name;
                                    let image = wednesday[i].rec_image;
                                    let categ = wednesday[i].rec_categ;
                                    let rate = wednesday[i].rec_rate;
                                    let count = wednesday[i].rec_rateCount;
                                    wrecName.push(name);
                                    wrecId.push(id);
                                    wrecImage.push(image);
                                    wrecCateg.push(categ);
                                    wrecRate.push(rate);
                                    wrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function thursday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Thursday"',[dateC, dateD, session.userId], (err, thursday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< thursday.length; i++){
                                    let id = thursday[i].rec_id;
                                    let name = thursday[i].rec_name;
                                    let image = thursday[i].rec_image;
                                    let categ = thursday[i].rec_categ;
                                    let rate = thursday[i].rec_rate;
                                    let count = thursday[i].rec_rateCount;
                                    threcName.push(name);
                                    threcId.push(id);
                                    threcImage.push(image);
                                    threcCateg.push(categ);
                                    threcRate.push(rate);
                                    threcRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function friday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Friday"',[dateC, dateD, session.userId], (err, friday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< friday.length; i++){
                                    let id = friday[i].rec_id;
                                    let name = friday[i].rec_name;
                                    let image = friday[i].rec_image;
                                    let categ = friday[i].rec_categ;
                                    let rate = friday[i].rec_rate;
                                    let count = friday[i].rec_rateCount;
                                    frecName.push(name);
                                    frecId.push(id);
                                    frecImage.push(image);
                                    frecCateg.push(categ);
                                    frecRate.push(rate);
                                    frecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function saturday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Saturday"',[dateC, dateD, session.userId], (err, saturday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< saturday.length; i++){
                                    let id = saturday[i].rec_id;
                                    let name = saturday[i].rec_name;
                                    let image = saturday[i].rec_image;
                                    let categ = saturday[i].rec_categ;
                                    let rate = saturday[i].rec_rate;
                                    let count = saturday[i].rec_rateCount;
                                    srecName.push(name);
                                    srecId.push(id);
                                    srecImage.push(image);
                                    srecCateg.push(categ);
                                    srecRate.push(rate);
                                    srecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function sunday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.day BETWEEN ? AND ? AND user_id =? AND mealPlan.sDay = "Sunday"',[dateC, dateD, session.userId], (err, sunday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< sunday.length; i++){
                                    let id = sunday[i].rec_id;
                                    let name = sunday[i].rec_name;
                                    let image = sunday[i].rec_image;
                                    let categ = sunday[i].rec_categ;
                                    let rate = sunday[i].rec_rate;
                                    let count = sunday[i].rec_rateCount;
                                    surecName.push(name);
                                    surecId.push(id);
                                    surecImage.push(image);
                                    surecCateg.push(categ);
                                    surecRate.push(rate);
                                    surecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                async function getMealPlan(){
                    let mondayrec = await monday();
                    let tuerec = await tuesday();
                    let wedrec = await wednesday();
                    let thursrec = await thursday();
                    let frirec = await friday();
                    let satrec = await saturday();
                    let sunrec = await sunday();
                    console.log(mondayrec);

                    let msg = req.flash('msg');
                    conn.release();
                    res.render('mealPlan', {title: 'MealPlan', mrecName: mrecName, mrecId: mrecId, mrecImage: mrecImage, mrecCateg: mrecCateg, mrecRate: mrecRate, mrecRateCount: mrecRateCount, trecName: trecName, trecId: trecId, trecImage: trecImage, trecCateg: trecCateg, trecRate: trecRate, trecRateCount: trecRateCount, wrecName: wrecName, wrecId: wrecId, wrecImage: wrecImage, wrecCateg: wrecCateg, wrecRate: wrecRate, wrecRateCount: wrecRateCount, threcName: threcName, threcId: threcId, threcImage: threcImage, threcCateg: threcCateg, threcRate: threcRate, threcRateCount: threcRateCount, frecName: frecName, frecId: frecId, frecImage: frecImage, frecCateg: frecCateg, frecRate: frecRate, frecRateCount: frecRateCount, srecName: srecName, srecId: srecId, srecImage: srecImage, srecCateg: srecCateg, srecRate: srecRate, srecRateCount: srecRateCount, surecName: surecName, surecId: surecId, surecImage: surecImage, surecCateg: surecCateg, surecRate: surecRate, surecRateCount: surecRateCount, msg, id: session.userName});
                }
                if(session.userId){
                    getMealPlan();
                }
                else{
                    req.flash('msg', 'You need to login to view Meal Plan Recipes!')
                    res.redirect('/login');
                }
            }
        })  
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.mealPlanNextBut = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if (err){
                console.log(err);
                conn.release();
            }
            else{
                let mrecName = [];
                let mrecId = [];
                let mrecImage = [];
                let mrecCateg = [];
                let mrecRate = [];
                let mrecRateCount = [];
                let trecName = [];
                let trecId = [];
                let trecImage = [];
                let trecCateg = [];
                let trecRate = [];
                let trecRateCount = [];
                let wrecName = [];
                let wrecId = [];
                let wrecImage = [];
                let wrecCateg = [];
                let wrecRate = [];
                let wrecRateCount = [];
                let threcName = [];
                let threcId = [];
                let threcImage = [];
                let threcCateg = [];
                let threcRate = [];
                let threcRateCount = [];
                let frecName = [];
                let frecId = [];
                let frecImage = [];
                let frecCateg = [];
                let frecRate = [];
                let frecRateCount = [];
                let srecName = [];
                let srecId = [];
                let srecImage = [];
                let srecCateg = [];
                let srecRate = [];
                let srecRateCount = [];
                let surecName = [];
                let surecId = [];
                let surecImage = [];
                let surecCateg = [];
                let surecRate = [];
                let surecRateCount = [];
                let date = new Date();
                session = req.session;

                Date.prototype.getWeek = function() {
                    var date = new Date(this.getTime());
                    date.setHours(0, 0, 0, 0);
                    // Thursday in current week decides the year.
                    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                    // January 4 is always in week 1.
                    var week1 = new Date(date.getFullYear(), 0, 4);
                    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                };

                let dateC = date.getWeek() + 1;

                function monday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Monday"',[dateC, session.userId], (err, monday) =>{
                            if(err){
                                console.log(err)
                            }
                            else {
                                for(let i = 0; i< monday.length; i++){
                                    let id = monday[i].rec_id;
                                    let name = monday[i].rec_name;
                                    let image = monday[i].rec_image;
                                    let categ = monday[i].rec_categ;
                                    let rate = monday[i].rec_rate;
                                    let count = monday[i].rec_rateCount;
                                    mrecName.push(name);
                                    mrecId.push(id);
                                    mrecImage.push(image);
                                    mrecCateg.push(categ);
                                    mrecRate.push(rate);
                                    mrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function tuesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Tuesday"',[dateC, session.userId], (err, tuesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< tuesday.length; i++){
                                    let id = tuesday[i].rec_id;
                                    let name = tuesday[i].rec_name;
                                    let image = tuesday[i].rec_image;
                                    let categ = tuesday[i].rec_categ;
                                    let rate = tuesday[i].rec_rate;
                                    let count = tuesday[i].rec_rateCount;
                                    trecName.push(name);
                                    trecId.push(id);
                                    trecImage.push(image);
                                    trecCateg.push(categ);
                                    trecRate.push(rate);
                                    trecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function wednesday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Wednesday"',[dateC, session.userId], (err, wednesday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< wednesday.length; i++){
                                    let id = wednesday[i].rec_id;
                                    let name = wednesday[i].rec_name;
                                    let image = wednesday[i].rec_image;
                                    let categ = wednesday[i].rec_categ;
                                    let rate = wednesday[i].rec_rate;
                                    let count = wednesday[i].rec_rateCount;
                                    wrecName.push(name);
                                    wrecId.push(id);
                                    wrecImage.push(image);
                                    wrecCateg.push(categ);
                                    wrecRate.push(rate);
                                    wrecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function thursday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Thursday"',[dateC, session.userId], (err, thursday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< thursday.length; i++){
                                    let id = thursday[i].rec_id;
                                    let name = thursday[i].rec_name;
                                    let image = thursday[i].rec_image;
                                    let categ = thursday[i].rec_categ;
                                    let rate = thursday[i].rec_rate;
                                    let count = thursday[i].rec_rateCount;
                                    threcName.push(name);
                                    threcId.push(id);
                                    threcImage.push(image);
                                    threcCateg.push(categ);
                                    threcRate.push(rate);
                                    threcRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function friday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Friday"',[dateC, session.userId], (err, friday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< friday.length; i++){
                                    let id = friday[i].rec_id;
                                    let name = friday[i].rec_name;
                                    let image = friday[i].rec_image;
                                    let categ = friday[i].rec_categ;
                                    let rate = friday[i].rec_rate;
                                    let count = friday[i].rec_rateCount;
                                    frecName.push(name);
                                    frecId.push(id);
                                    frecImage.push(image);
                                    frecCateg.push(categ);
                                    frecRate.push(rate);
                                    frecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function saturday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Saturday"',[dateC, session.userId], (err, saturday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< saturday.length; i++){
                                    let id = saturday[i].rec_id;
                                    let name = saturday[i].rec_name;
                                    let image = saturday[i].rec_image;
                                    let categ = saturday[i].rec_categ;
                                    let rate = saturday[i].rec_rate;
                                    let count = saturday[i].rec_rateCount;
                                    srecName.push(name);
                                    srecId.push(id);
                                    srecImage.push(image);
                                    srecCateg.push(categ);
                                    srecRate.push(rate);
                                    srecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                function sunday(){
                    return new Promise((resolve, reject) => {
                        conn.query('SELECT * FROM rec INNER JOIN mealPlan ON rec.rec_id=mealPlan.rec_id WHERE mealPlan.weekCount = ? AND user_id =? AND mealPlan.sDay = "Sunday"',[dateC, session.userId], (err, sunday) =>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                for(let i = 0; i< sunday.length; i++){
                                    let id = sunday[i].rec_id;
                                    let name = sunday[i].rec_name;
                                    let image = sunday[i].rec_image;
                                    let categ = sunday[i].rec_categ;
                                    let rate = sunday[i].rec_rate;
                                    let count = sunday[i].rec_rateCount;
                                    surecName.push(name);
                                    surecId.push(id);
                                    surecImage.push(image);
                                    surecCateg.push(categ);
                                    surecRate.push(rate);
                                    surecRateCount.push(count);
                                }
                                resolve();
                            }
                        })
                    })
                };

                async function getMealPlan(){
                    let mondayrec = await monday();
                    let tuerec = await tuesday();
                    let wedrec = await wednesday();
                    let thursrec = await thursday();
                    let frirec = await friday();
                    let satrec = await saturday();
                    let sunrec = await sunday();
                    console.log(mondayrec);

                    let msg = req.flash('msg');
                    conn.release();
                    res.render('mealPlan', {title: 'MealPlan', mrecName: mrecName, mrecId: mrecId, mrecImage: mrecImage, mrecCateg: mrecCateg, mrecRate: mrecRate, mrecRateCount: mrecRateCount, trecName: trecName, trecId: trecId, trecImage: trecImage, trecCateg: trecCateg, trecRate: trecRate, trecRateCount: trecRateCount, wrecName: wrecName, wrecId: wrecId, wrecImage: wrecImage, wrecCateg: wrecCateg, wrecRate: wrecRate, wrecRateCount: wrecRateCount, threcName: threcName, threcId: threcId, threcImage: threcImage, threcCateg: threcCateg, threcRate: threcRate, threcRateCount: threcRateCount, frecName: frecName, frecId: frecId, frecImage: frecImage, frecCateg: frecCateg, frecRate: frecRate, frecRateCount: frecRateCount, srecName: srecName, srecId: srecId, srecImage: srecImage, srecCateg: srecCateg, srecRate: srecRate, srecRateCount: srecRateCount, surecName: surecName, surecId: surecId, surecImage: surecImage, surecCateg: surecCateg, surecRate: surecRate, surecRateCount: surecRateCount, msg, id: session.userName});
                }
                if(session.userId){
                    getMealPlan();
                }
                else{
                    req.flash('msg', 'You need to login to view Meal Plan Recipes!')
                    res.redirect('/login');
                }
            }
        })  
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.mealPlanEditButton = (req, res) => {
    Date.prototype.getWeek = function() {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        var week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks from date to week1.
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    let id = req.body.recID;
                    conn.query('SELECT * FROM mealPlan WHERE rec_id = ?', [id], (err, row) => {
                        if(err){
                            console.log(err);
                            conn.release();
                        }
                        else{
                            let dateTime = req.body.datetimes;
                            let date = new Date(dateTime);
                            let rec = new Recipe.Recipe();
                            let userid = req.session.userId;
                            let id = req.body.recID;
                            let mon = String(date.getMonth());
                            let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            let month = months[date.getMonth()];
                            let day = date.getDate();
                            let day1 = String(date.getDate());
                            let dayMonth = day1 + mon;
                            let sDay = days[date.getDay()];
                            let week = date.getWeek();
                            let hr = date.getHours();
                            let ampm = "am";
                            if( hr > 12 ) {
                                hr -= 12;
                                ampm = "pm";
                            }
                            let min = date.getMinutes();
                            if (min < 10) {
                                min = "0" + min;
                            }
                            let time = hr + ":" + min + ampm;
                            console.log(month, day, sDay, time, date, week, dayMonth);
                            conn.query('UPDATE mealPlan SET user_id = ?, rec_id = ?, month = ?, day = ?, time = ?, sDay = ?, weekCount = ?, dateTime = ?, dayMonth = ? WHERE rec_id =?', [req.session.userId, id, month, day, time, sDay, week, dateTime, dayMonth, id], (err, row) => {
                            if(err){
                                console.log(err);
                                conn.release();
                            }
                            else{
                                conn.release();
                                req.flash('msg', 'Successfully rescheduled the Meal Plan!');
                                res.redirect('/mealPlan/' + id); 
                            }
                            })
                            // conn.release();
                        }
                    })
                }

                    
            })
        }else{
            req.flash('msg', 'You need to login to add the recipe to your Meal Plan!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}
exports.userSearchSaveUnsaved = (req, res) =>{
    try{
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                let id = req.params.id;
                conn.query('DELETE FROM saved where rec_id =?', [id], (err, result) => {
                    if(err){
                        console.log('not deleted');
                        conn.release();
                        res.redirect('/recipes/' + id); 
                        // conn.release();
                    }
                    else{
                        conn.query('DELETE FROM saved_recing WHERE rec_id =?', [id]);
                        conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, saved) => {
                            if(err){
                                console.log(err);
                                conn.release();
                            }
                            else{
                                let getSaved = saved[0].user_Saved;
                                if(getSaved){
                                    let savedArr = getSaved.split('/');
                                    if (savedArr.includes(id)) {
                                        for(let i = 0; i < savedArr.length; i++){ 
                                            if (savedArr[i] === id) { 
                                                savedArr.splice(i, 1); 
                                            }
                                        }
                                    }
                                    conn.query('UPDATE users SET user_Saved = ?', [savedArr]);
                                    console.log(id);
                                    console.log('deleted');
                                }
                            }
                        })
                        conn.release();
                        req.flash('msg', 'Recipe successfully unsaved!');
                        res.redirect('/search'); 
                    }
                })
            })
        }
    }
    catch(error){
        res.status(500).json({ message: error.message });

    }
}
exports.userSearchSave = (req, res) =>{
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn)=>{
                let userid = req.session.userId;
                let id = req.body.recID;
                let name = req.body.recName;
                let desc = req.body.recDesc;
                let categ = req.body.recCateg;
                let time = req.body.recTime;
                let serving = req.body.recServing;
                let src = req.body.recSrc;
                let vid = req.body.recVid;
                let cal = req.body.recCal;
                let pr = req.body.recProcess;
                let mealTime = req.body.recMealtime;
                let img = req.body.recImg;
                let rate = req.body.recRate;
                // console.log(rec_id);
                if(err){
                    console.log(err);
                    conn.release();
                }
                else{
                    conn.query('SELECT user_Saved FROM users WHERE user_id = ?', [session.userId], (err, saved) =>{
                        if (err) {
                            console.log(err);   
                            conn.release();
                        } else {
                            let getSaved = saved[0].user_Saved;
                            if(getSaved === null){
                                getSaved = '';
                            }
                            getSaved += id.toString() + '/';

                            conn.query('UPDATE users SET user_Saved = ? WHERE user_id = ?', [getSaved, session.userId], (err, row) => {
                                if(err){
                                    console.log(err);
                                    conn.release();
                                }
                                else{
                                    // console.log(rec_id);
                                    conn.query('INSERT INTO saved(user_id, rec_id, rec_name, rec_desc, rec_process, rec_categ, rec_time, rec_serving, rec_src, rec_vid, rec_cal, rec_mealTime, rec_img, rec_rate) VALUE(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [userid, id, name, desc, pr, categ, time, serving, src, vid, cal, mealTime, img, rate], (err, row) => {
                                        if(err){
                                            console.log(err);
                                            conn.release();
                                        }
                                         else{
                                            conn.query('INSERT IGNORE INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) SELECT recId, ingId, ingQuant, ingUnit, ingIns FROM recing WHERE recId = ?', [id], (err, row) => {
                                                if(err){
                                                    console.log(err);
                                                    conn.release();
                                                } else{
                                                    conn.release();
                                                    req.flash('msg', 'Recipe successfully saved!');
                                                    res.redirect('/search'); 
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                        }
                    })
                    
                }
            })
        }else{
            req.flash('msg', 'You need to login to save the recipe!')
            res.redirect('/login');
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.saveCreatedRec = (req, res) => {
    try {
        session = req.session;
        if(session.userId){
            let msg = req.flash('msg');
            res.render('savedCreate', {id: session.userId, msg});
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.savedSubmitCreate = (req, res) => {
    try{
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                if (err) {
                    console.log(err);
                } else {
                    let rec = new Recipe.Recipe();
                    rec.name = req.body.recNameInp;
                    rec.desc = req.body.recDescInp;
                    rec.prc = req.body.recPrcInp;
                    rec.time = req.body.recTimeInp;
                    rec.srv = req.body.recSrvInp;
                    rec.mTime = req.body.recMTimeInp;
                    let mString = '';
                    if(Array.isArray(rec.getRecMTime())){
                        rec.getRecMTime().forEach(time => {
                            mString += time + ', ';
                        });
                    }else{
                        mString = rec.getRecMTime();
                    }
                    let newRecId = 0;
                    let id = Math.floor(1000 + Math.random() * 9000);
                    conn.query('SELECT * FROM saved WHERE rec_id = ?', [id], (err, res) => {
                        if (err) {
                            console.log(err);
                        } else if(res[0]){
                            let newId = Math.floor(Math.random()*90000) + 10000;
                            newRecId = newId;
                            insertFunc(session.userId, newRecId, rec.getRecName(), rec.getRecDesc(), rec.getRecPrc(), rec.getRecTime(), rec.getRecSrv(), mString);
                        }
                        else {
                            newRecId = id;
                            insertFunc(session.userId, newRecId, rec.getRecName(), rec.getRecDesc(), rec.getRecPrc(), rec.getRecTime(), rec.getRecSrv(), mString);
                        }
                    })


                    function insertFunc(userId, newRecId, RecName, RecDesc, RecPrc, RecTime, RecSrv, mString) {
                        conn.query('INSERT INTO saved(user_id, rec_id, rec_name, rec_desc, rec_process, rec_time, rec_serving, rec_mealTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [userId, newRecId, RecName, RecDesc, RecPrc, RecTime, RecSrv, mString], (err, result) => {
                            if(err){
                                console.log(err, '\n');
                                conn.release();
                            }else{
                                let ing = new Recipe.Ing();
                                let ingNum = req.body.ingNum;
                                ing.quant = JSON.parse(req.body.qval);
                                ing.name = JSON.parse(req.body.idval);
                                ing.unit = JSON.parse(req.body.uval);
                                ing.ins = JSON.parse(req.body.insval);
    
                                function insertNewIng(ingName){
                                    return new Promise((resolve, reject) => {
                                        let newIngId;
                                        let id = Math.floor(1000 + Math.random() * 9000);
                                        conn.query('SELECT * FROM saved_ing WHERE savedIng_id = ?', [id], (err, res) => {
                                            if (err) {
                                                console.log(err);
                                            } else if(res[0]){
                                                let newId = Math.floor(Math.random()*90000) + 10000;
                                                newIngId =  newId;
                                                conn.query('INSERT INTO `saved_ing`(`savedIng_id`, `ing_name`) VALUES (?, ?)', [newIngId, ingName],(err, ins) =>{
                                                    if(err){
                                                        console.log(err, '\n');
                                                    } else{
                                                        resolve(newIngId);
                                                    }
                                                });
                                            }
                                            else {
                                                newIngId =  id;
                                                conn.query('INSERT INTO `saved_ing`(`savedIng_id`, `ing_name`) VALUES (?, ?)', [newIngId, ingName],(err, ins) =>{
                                                    if(err){
                                                        console.log(err, '\n');
                                                    } else{
                                                        resolve(newIngId);
                                                    }
                                                });
                                            }
                                        })
    
    
                                    })
                                }

                                async function insertRecIng(ingName, qf, ingUnit, ingIns){
                                    const ii = await insertNewIng(ingName);
                                    conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [newRecId, ii, qf, ingUnit, ingIns], (err, row) => {
                                        if(err){
                                            console.log(err, '\n');
                                            conn.release();
                                        }
                                        else{
                                            console.log('new ing added + recing inserted...\n');
                                        }
                                    })
                                    
                                }

                                for(let z = 0; z < ingNum; z++){
                                    let ingQuant = ing.getIngQuant()[z];
                                    let ingUnit = ing.getIngUnit()[z];
                                    let ingName = ing.getIngName()[z];
                                    let ingIns = ing.getIngIns()[z];
                                    let qf; 
                                    if(parseFloat(ingQuant)){
                                        qf = parseFloat(ingQuant);
                                    }
                                    else{
                                        qf = 0;
                                    }

                                    conn.query('SELECT * FROM saved_ing WHERE ing_name = ?', [ingName], (err, rows) =>{
                                        if(err){
                                            console.log(err, '\n');
                                            conn.release();
                                        }
                                        else if(rows[0]){
                                            console.log();
                                            let ii = rows[0].savedIng_id;
                                            conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [newRecId, ii, qf, ingUnit, ingIns], (err, row) => {
                                                if(err){
                                                    console.log(err, '\n');
                                                    conn.release();
                                                }
                                                else{
                                                    console.log('recing added...\n');
                                                }
                                            })
                                        }
                                        else{
                                            insertRecIng(ingName, qf, ingUnit, ingIns);
                                        }
                                    })
                                }
                                conn.release();
                                req.flash('msg', 'Recipe saved!');
                                res.redirect('/saved'); 
                            }
                        })
                    }

                }
            })

        }
        else{
            req.flash('msg', 'You need to login to view create recipe!')
            res.redirect('/login');
        }
    }
    catch(error){
        res.json({ message: error.message });
    }
}

exports.getCreatedRec = (req, res) => {
    try {
        pool.getConnection((err, conn) => {
            if(err){
                console.log('error in user recipes...\n');
                conn.release();
            }
            else{
                let rId = req.params.id;
                conn.query('SELECT * FROM saved WHERE rec_id = ?',[rId], (err, save) => {
                    if(err){
                        console.log('cannot fetch recipes in db...\n');
                        conn.release();
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
                        let qStr = 'SELECT saved_recing.*, saved_ing.ing_name FROM `saved_recing` INNER JOIN saved_ing ON saved_recing.ingId = saved_ing.savedIng_id WHERE saved_recing.rec_id = ?';
                        function getIngs(id){
                            return new Promise((resolve, reject) => {
                                conn.query(qStr, [id], (err, ings) => {
                                    if(err){
                                        console.log(err, '\n');
                                        conn.release();
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
                        
                        async function getAllRecIng(save){
                            for(id of save){
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
                            let msg = req.flash('msg');
                            session = req.session;
                            // let isRated = false;
                            // let isSaved = false;
                            // let isMeal = false;
                            // let ratedArr = [];
                            if(session.userId){
                            conn.release();
                            res.render('savedCreateRecView', { save: save, recIngs: recIngs, ins: insArr, quantArr: quantArr, msg, id: session.userId});

                            }
                            
                        }
                        getAllRecIng(save);
                    }
                })
                         
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
}

exports.delCreatedRec = (req, res) => {
    try {
        session = req.session;
        if(session.userId){
            pool.getConnection((err, conn) => {
                let rId = req.params.id;
                conn.query('DELETE saved, saved_recing FROM saved_recing INNER JOIN saved WHERE saved_recing.rec_id=saved.rec_id AND saved_recing.rec_id = ?', [rId], (err, result) => {
                    if(err){
                        req.flash('msg', 'recipe deletion failed!')
                        conn.release();
                        res.redirect('/saved'); 
                    }
                    else{
                        conn.release();
                        req.flash('msg', 'recipe successfully deleted!')
                        res.redirect('/saved'); 
                    }
                })
            })
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.editCreatedRec = (req,res) => {
    try {
        let rId = req.params.id;
        pool.getConnection((err, conn) => {
            if(err){
                console.log(err, '\n');
                conn.release();   
            }
            else{
                conn.query('SELECT * FROM saved WHERE rec_id = ?', [rId], (err, row) =>{
                    if(err){
                        console.log(err, '\n');
                        conn.release();  
                    }
                    else{
                        conn.query('SELECT saved_recing.*, saved_ing.ing_name FROM `saved_recing` INNER JOIN saved_ing ON saved_recing.ingId = saved_ing.savedIng_id WHERE saved_recing.rec_id = ?',[rId], (err, ingRow) =>{
                            if(err){
                                console.log(err, '\n');
                                conn.release();  
                            }
                            else{
                                conn.release();
                                res.render('savedCreateRecEdit', {title: 'Edit Recipe', save: row, ing: ingRow});
                                  
                            }
                        }) 
                    }  
                })
            }
        })
        }
     catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.submitEditedCreatedRec = (req, res) => {
    try {
        session = req.session;
        pool.getConnection((err, conn)=>{
            if(err){
                console.log(err, '\n');
                conn.release();
            }
            else{
                let rId = req.params.id;
                let rec = new Recipe.Recipe();
                rec.name = req.body.recNameInp;
                rec.desc = req.body.recDescInp;
                rec.prc = req.body.recPrcInp;
                rec.time = req.body.recTimeInp;
                rec.srv = req.body.recSrvInp;
                rec.mTime = req.body.recMTimeInp;
                let mString = '';
                if(Array.isArray(rec.getRecMTime())){
                    rec.getRecMTime().forEach(time => {
                        mString += time + ', ';
                    });
                }else{
                    mString = rec.getRecMTime();
                }
                conn.query('UPDATE `saved` SET `rec_name`= ?,`rec_desc`= ?,`rec_process`= ?,`rec_time`= ?, `rec_serving`=?, `rec_mealTime`= ? WHERE rec_id = ?', [rec.getRecName(), rec.getRecDesc(), rec.getRecPrc(), rec.getRecTime(), rec.getRecSrv(), mString, rId], (err, save) => {
                    if(err){
                        console.log(err, '\n');
                        conn.release();
                    }
                    else{
                        conn.query('DELETE FROM saved_recing WHERE rec_id = ?', [rId], (err, row) =>{
                            if(err){
                                console.log(err, '\n');
                                conn.release();
                            }
                            else{ 

                                let ing = new Recipe.Ing();
                                let ingNum = req.body.ingNum;
                                ing.quant = JSON.parse(req.body.qval);
                                ing.name = JSON.parse(req.body.idval);
                                ing.unit = JSON.parse(req.body.uval);
                                ing.ins = JSON.parse(req.body.insval);

                                function insertNewIng(ingName){
                                    return new Promise((resolve, reject) => {
                                        let newIngId;
                                        let id = Math.floor(1000 + Math.random() * 9000);
                                        conn.query('SELECT * FROM saved_ing WHERE savedIng_id = ?', [id], (err, res) => {
                                            if (err) {
                                                console.log(err);
                                            } else if(res[0]){
                                                let newId = Math.floor(Math.random()*90000) + 10000;
                                                newIngId =  newId;
                                                conn.query('INSERT INTO `saved_ing`(`savedIng_id`, `ing_name`) VALUES (?, ?)', [newIngId, ingName],(err, ins) =>{
                                                    if(err){
                                                        console.log(err, '\n');
                                                    } else{
                                                        resolve(newIngId);
                                                    }
                                                });
                                            }
                                            else {
                                                newIngId =  id;
                                                conn.query('INSERT INTO `saved_ing`(`savedIng_id`, `ing_name`) VALUES (?, ?)', [newIngId, ingName],(err, ins) =>{
                                                    if(err){
                                                        console.log(err, '\n');
                                                    } else{
                                                        resolve(newIngId);
                                                    }
                                                });
                                            }
                                        })


                                    })
                                }

                                async function insertRecIng(ingName, qf, ingUnit, ingIns){
                                    const ii = await insertNewIng(ingName);
                                    conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [rId, ii, qf, ingUnit, ingIns], (err, row) => {
                                        if(err){
                                            console.log(err, '\n');
                                            conn.release();
                                        }
                                        else{
                                            console.log('new ing added + recing inserted...\n');
                                        }
                                    })
                                    
                                }

                                for(let z = 0; z < ingNum; z++){
                                    let ingQuant = ing.getIngQuant()[z];
                                    let ingUnit = ing.getIngUnit()[z];
                                    let ingName = ing.getIngName()[z];
                                    let ingIns = ing.getIngIns()[z];
                                    let qf; 
                                    if(parseFloat(ingQuant)){
                                        qf = parseFloat(ingQuant);
                                    }
                                    else{
                                        qf = 0;
                                    }

                                    conn.query('SELECT * FROM saved_ing WHERE ing_name = ?', [ingName], (err, rows) =>{
                                        if(err){
                                            console.log(err, '\n');
                                            conn.release();
                                        }
                                        else if(rows[0]){
                                            let ii = rows[0].savedIng_id;
                                            conn.query('INSERT INTO saved_recing(rec_id, ingId, ingQuant, ingUnit, ingIns) VALUES (?, ?, ?, ?, ?)', [rId, ii, qf, ingUnit, ingIns], (err, row) => {
                                                if(err){
                                                    console.log(err, '\n');
                                                    conn.release();
                                                }
                                                else{
                                                    console.log('recing added...\n');
                                                }
                                            })
                                        }
                                        else{
                                            insertRecIng(ingName, qf, ingUnit, ingIns);
                                        }
                                    })
                                }
                                conn.release();
                                req.flash('msg', 'recipe successfully edited!')
                                res.redirect('/saved');
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
        res.json({ message: error.message });
    }
}

exports.generatemealPlan = (req,res) => {
    try{
        pool.getConnection((err, conn) => {
            session = req.session;
            let recID = [];
            let brecImage = [];
            let brecId = [];
            let brecName = [];
            let userRecIds = [];
            let brecCateg = [];
            let brecRate = [];
            let brecRateCount = [];
            let userAllergy = [];
            let userRestrict = [];
            let breakfastID = [];
            let lunchID = [];
            let dinnerID = [];
            let lrecName = [];
            let lrecId = [];
            let lrecImage = [];
            let lrecCateg = [];
            let lrecRate = [];
            let lrecRateCount = [];
            let drecName = [];
            let drecId = [];
            let drecImage = [];
            let drecCateg = [];
            let drecRate = [];
            let drecRateCount = [];

            function getRecIds(){
                return new Promise((resolve, reject) =>{
                    conn.query('SELECT rec_id FROM rec', (err, row) =>{
                        if (err){
                            console.log(err);
                        }
                        else{
                            for(let i = 0; i< row.length; i++){
                                let recid = row[i].rec_id;
                                recID.push(recid);
                                console.log(recid);
                            }
                            resolve();
                        }
                    })
                })
            };
            function getRestriction(id){
                return new Promise((resolve, reject) => {
                    conn.query('SELECT user_allergy, user_restrict FROM users WHERE user_id = ?', [id], (err, row) =>{
                        if (err) {
                            console.log(err);
                        } 
                        else{
                            let ua = row[0].user_allergy;
                            let ur = row[0].user_restrict;
                            if(ua){
                                userAllergy.push(ua);
                                console.log(userAllergy);
                            } 
                            if(ur){
                                userRestrict.push(ur);
                                console.log(userRestrict);
                            }
                            console.log('ua: ', ua);
                            console.log('ur: ', ur);
                            resolve('got');
                        }
                    })
                })
            };

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
                                    // console.log(allergy);
                                    // console.log(aArr);
                                    aArr.forEach(a => {
                                        if(a){
                                            console.log(a);
                                            if(allergy.includes(a)){
                                                idStr += id + '/';
                                            }
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
            };
            
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
            };

            function breakfast(){
                return new Promise((resolve, reject) => {
                    conn.query('SELECT rec_id FROM rec WHERE rec_mealTime LIKE "%Breakfast%" ORDER BY RAND() LIMIT 7', (err, breakfast) =>{
                        if(err){
                            console.log(err)
                        }
                        else{
                            for(let i = 0; i< breakfast.length; i++){
                                let recid = breakfast[i].rec_id;
                                breakfastID.push(recid);
                            }
                            resolve();
                        }
                    })
                })
            };

            function breakfastDetails(id) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM rec WHERE rec_id = ?', [id], (err, breakfast) =>{
                        if(err){
                            console.log(err);
                        }
                        else{
                            let id = breakfast[0].rec_id;
                            let name = breakfast[0].rec_name;
                            let image = breakfast[0].rec_image;
                            let categ = breakfast[0].rec_categ;
                            let rate = breakfast[0].rec_rate;
                            let count = breakfast[0].rec_rateCount;
                            brecName.push(name);
                            brecId.push(id);
                            brecImage.push(image);
                            brecCateg.push(categ);
                            brecRate.push(rate);
                            brecRateCount.push(count);
                            resolve();
                        }
                    })
                })
            };

            function lunch(){
                return new Promise((resolve, reject) => {
                    conn.query('SELECT rec_id FROM rec WHERE rec_mealTime LIKE "%Lunch%" ORDER BY RAND() LIMIT 7', (err, lunch) =>{
                        if(err){
                            console.log(err)
                        }
                        else{
                            for(let i = 0; i< lunch.length; i++){
                                let recid = lunch[i].rec_id;
                                lunchID.push(recid);
                            }
                            resolve();
                        }
                    })
                })
            };

            function lunchDetails(id) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM rec WHERE rec_id = ?', [id], (err, lunch) =>{
                        if(err){
                            console.log(err);
                        }
                        else{
                            let id = lunch[0].rec_id;
                            let name = lunch[0].rec_name;
                            let image = lunch[0].rec_image;
                            let categ = lunch[0].rec_categ;
                            let rate = lunch[0].rec_rate;
                            let count = lunch[0].rec_rateCount;
                            lrecName.push(name);
                            lrecId.push(id);
                            lrecImage.push(image);
                            lrecCateg.push(categ);
                            lrecRate.push(rate);
                            lrecRateCount.push(count);
                            resolve();
                        }
                    })
                })
            };

            function dinner(){
                return new Promise((resolve, reject) => {
                    conn.query('SELECT rec_id FROM rec WHERE rec_mealTime LIKE "%Dinner%" ORDER BY RAND() LIMIT 7', (err, dinner) =>{
                        if(err){
                            console.log(err)
                        }
                        else{
                            for(let i = 0; i< dinner.length; i++){
                                let recid = dinner[i].rec_id;
                                dinnerID.push(recid);
                            }
                            resolve();
                        }
                    })
                })
            };

            function dinnerDetails(id) {
                return new Promise((resolve, reject) => {
                    conn.query('SELECT * FROM rec WHERE rec_id = ?', [id], (err, dinner) =>{
                        if(err){
                            console.log(err);
                        }
                        else{
                            let id = dinner[0].rec_id;
                            let name = dinner[0].rec_name;
                            let image = dinner[0].rec_image;
                            let categ = dinner[0].rec_categ;
                            let rate = dinner[0].rec_rate;
                            let count = dinner[0].rec_rateCount;
                            drecName.push(name);
                            drecId.push(id);
                            drecImage.push(image);
                            drecCateg.push(categ);
                            drecRate.push(rate);
                            drecRateCount.push(count);
                            resolve();
                        }
                    })
                })
            };

            async function generatemealPlan(){
                let rec = await getRecIds();
                console.log('rar');
                console.log(recID);
                let allergy = await getRestriction(session.userId);
                if (allergy == 'got'){
                    let idFilter = [];
                    let idStr = await getFilteredIngIds(userAllergy, userRestrict);
                    idFilter = idStr.split('/'); //ing id of with restrictions and allergies
                
                    console.log('ids of restrict ing');
                    console.log(idFilter);
                    for (const i of idFilter) {
                        const id = await getUserRecIds(i); //rec ids tht has the restriction and allergy ings
                    }

                    console.log('rec ids of id filter');
                    console.log(userRecIds);

                    let breakfastid = await breakfast(); //rec ids of the recs with breakfast
                    for (let index = 0; index < userRecIds.length; index++) {
                        let element = userRecIds[index];
                        if (breakfastID.includes(element)) {
                            for(let i = 0; i < breakfastID.length; i++){ 
                                if (breakfastID[i] === element) { 
                                    breakfastID.splice(i, 1); 
                                }
                            }
                        } 
                    }

                    for (const rec of breakfastID) {
                        let rf = await breakfastDetails(rec);
                    }
                    console.log('b');
                    console.log(breakfastID);

                    let lunchid = await lunch(); // rec ids of the recs with lunch
                    console.log(lunchID);
                    for (let index = 0; index < userRecIds.length; index++) {
                        let element = userRecIds[index];
                        if (lunchID.includes(element)) {
                            for(let i = 0; i < lunchID.length; i++){ 
                                if (lunchID[i] === element) { 
                                    lunchID.splice(i, 1); 
                                }
                            }
                        } 
                    }

                    for (const rec of lunchID) {
                        let rf = await lunchDetails(rec);
                    }
                    console.log('l');
                    console.log(lunchID);

                    let dinnerid = await dinner(); //rec ids of the recs with dinner
                    console.log(dinnerID);
                    for (let index = 0; index < userRecIds.length; index++) {
                        let element = userRecIds[index];
                        if (dinnerID.includes(element)) {
                            for(let i = 0; i < dinnerID.length; i++){ 
                                if (dinnerID[i] === element) { 
                                    dinnerID.splice(i, 1); 
                                }
                            }
                        } 
                    }

                    for (const rec of dinnerID) {
                        let rf = await dinnerDetails(rec);
                    }
                    console.log('d');
                    console.log(dinnerID);

                    let msg = req.flash('msg');
                    conn.release();
                    res.render('generatemealPlan', {title: 'Generated MealPlan', brecId: brecId, brecName: brecName, lrecName: lrecName, drecName: drecName,  lrecId: lrecId, drecId: drecId, brecImage: brecImage, lrecImage: lrecImage, drecImage: drecImage, brecCateg: brecCateg, lrecCateg: lrecCateg, drecCateg: drecCateg, brecRate: brecRate, lrecRate: lrecRate, drecRate: drecRate, brecRateCount: brecRateCount, lrecRateCount: lrecRateCount, drecRateCount: drecRateCount, msg, id: session.userName});
                }
            }
            generatemealPlan();
        })
    } catch (error) {
        res.json({ message: error.message });
    }
}
