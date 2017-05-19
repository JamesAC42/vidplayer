
jQuery(function($){
	$("div.ep-list").hide();
	$("div.show a").click(function(){
		$(this).parent().next().toggle();
	});
	$("div.letter-enabled").click(function(){
		var letter = $(this).text().toLowerCase();
		$("#" + letter).animatescroll({element:"div.show-container",scrollSpeed:1000, easing:'easeOutElastic',padding:5});
	});
	$("div.ep-list ul li").on('click', function(){
		var episode = $(this).text();
		$("div.ep-title").text(episode);
		var show = $(this).parent().parent().prev().children("a").text();
		$("div.ep-show").text(show);
		var vidpath = show + "/" + episode;
		var trackpath = 'tracks/' + show + '/' + episode.split('.')[0] + '.vtt';
		$.post("/getTrack", {'show':show, 'episode':episode}, callback=>{
			console.log("success");
			var date = new Date();
			window.setTimeout(function(){
				$("#video")[0].pause();
				$("#video-src").attr("src", vidpath);
				$("track").remove();
				$("#video").append("<track id='sub-src' label='English' kind='subtitles' srcland='en' src='" + trackpath + "' default>");
				$("#video")[0].load();
				$("#video")[0].play();
			}, 5000);
		});
	});
});