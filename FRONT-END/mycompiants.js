function searchComplaint(){

let input = document.getElementById("searchInput").value.toUpperCase()

let cards = document.querySelectorAll(".complaint-card")

cards.forEach(card =>{

let text = card.innerText.toUpperCase()

if(text.includes(input)){
card.style.display="block"
}else{
card.style.display="none"
}

})

}


/* Animated Counters */

let counters = document.querySelectorAll(".card h2")

counters.forEach(counter =>{

let target = +counter.innerText
let count = 0

let updateCounter = () =>{

let speed = target/40

count += speed

if(count < target){
counter.innerText = Math.ceil(count)
setTimeout(updateCounter,40)
}
else{
counter.innerText = target
}

}

updateCounter()

})