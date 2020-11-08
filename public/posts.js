 
$(document).ready(function () {
    // Count freqency of hash tags and display top ten tags
    const elementList = document.querySelectorAll('.hashtags');
    let arr = []
    elementList.forEach((item) => {
      arr.push(item.innerHTML)
    })
    let frequency = {};
    arr.forEach(function(item) {
      frequency[item] = frequency[item] ? frequency[item] + 1 : 1;
    });
    console.log(frequency);
    let intents = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(function(x) {
        return x[0];
      });
    console.log(intents);
    let topTen = intents.splice(0, 10);
    console.log(topTen)
    
    topTen.map(tag => {
      var s = document.createElement("span");
      s.innerHTML = '<a class="lead" href="' + tag +'" onclick="filterTags(this.text)">' + tag +'</a>'
      document.querySelector('#trending').appendChild(s);

    });

});

function filterTags(tag) {
    document.querySelector('#showAll').style.display = 'none'
    const t = tag;
    const elementList = document.querySelectorAll('.card');
    let hiddenArr = []
    console.log(elementList)
    elementList.forEach((item) => {
      item.style.display = 'flex'   
      if (t != 'all') {
        let tags = item.querySelectorAll('.hashtags')
        console.log(tags)
        let include = false;
        tags.forEach((tg) => {
          if (tg.innerHTML == t) {
            include = true
          }
        })
        if (include == false) {
          item.style.display = 'none'
          hiddenArr.push(item)
        }
      }

      })
      if (hiddenArr.length > 0) {
        document.querySelector('#showAll').style.display = 'flex'
      }
  }