navbar = document.querySelector('.header .flex .navbar');

let menuBtn = document.querySelector('#menu-btn');
if(menuBtn){
   document.querySelector('#menu-btn').onclick = () =>{
      navbar.classList.toggle('active');
      profile.classList.remove('active');
   }
}


profile = document.querySelector('.header .flex .profile');
let usrBtn = document.querySelector('#user-btn');
if(usrBtn){
   document.querySelector('#user-btn').onclick = () =>{
      profile.classList.toggle('active');
      navbar.classList.remove('active');
   }
}

let ldr = document.querySelector('.loader');
if(ldr){
   function loader(){
      ldr.style.display = 'none';
   }
}

function fadeOut(){
   setInterval(loader, 2000);
}

window.onload = fadeOut;

document.querySelectorAll('input[type="number"]').forEach(numberInput => {
   numberInput.oninput = () =>{
      if(numberInput.value.length > numberInput.maxLength) numberInput.value = numberInput.value.slice(0, numberInput.maxLength);
   };
});