data = {}

$(document).ready(function(){
    var url = "https://rrtyui.github.io/osu-archive/data/osu_standard.csv";
    var htmlobj= $.ajax({url:url,async:false});
});

function draw(data) {
	
}