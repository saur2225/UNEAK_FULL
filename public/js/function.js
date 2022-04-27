(function($) { 

	

	$(function() {
		var header = $(".start-style");
		$(window).scroll(function() {    
			var scroll = $(window).scrollTop();
		
			if (scroll >= 10) {
				header.removeClass('start-style').addClass("scroll-on");
			} else {
				header.removeClass("scroll-on").addClass('start-style');
			}
		});
	});		
		
	const dark=()=>{
		$("body").addClass("dark");
		$("#switch").text("Light Mode");
		$("#theme").removeClass("fa fa-moon-o");
		$("#theme").addClass("fa fa-sun-o");
		$("#logo").attr("src", "http://www.devoftech.com/img/front.png");
		$("#switch").addClass("switched");
	}

	const light=()=>{
			$("#logo").attr("src", "http://www.devoftech.com/img/blackl.png");
            $("#switch").text("Dark Mode");
            $("#theme").removeClass("fa fa-sun-o");
            $("#theme").addClass("fa fa-moon-o");
			$("body").removeClass("dark");
			$("#switch").removeClass("switched");
	}

	//Animation
	
	$(document).ready(function() {
		$('body.hero-anime').removeClass('hero-anime');
		if((localStorage.getItem('theme'))===null)
		{
			dark();
		}
		else if((localStorage.getItem('theme'))==='dark')
		{
			dark();
		}
		else{
			light();
		}

		var url=window.location.href
		var apply
		var page=url.match(/(\d+)$/)
		if(!page)
		{
			apply=1
		}else{
			apply=page[0]
		}
		var element = document.getElementById(`page${apply}`);
   		element.classList.add("page-item");
   		element.classList.add("clicked");
	});

	//Menu On Hover
		
	$('body').on('mouseenter mouseleave','.nav-item',function(e){
			if ($(window).width() > 750) {
				var _d=$(e.target).closest('.nav-item');_d.addClass('show');
				setTimeout(function(){
				_d[_d.is(':hover')?'addClass':'removeClass']('show');
				},1);
			}
	});	
	
	//Switch light/dark
	
	$("#switch").on('click', function () {
		//localStorage.removeItem('theme')
		if ($("body").hasClass("dark")) {
			localStorage.setItem('theme','light')
            light();
		}
		else {
			localStorage.setItem('theme','dark');
            dark();
		}
	});  
	var title=document.title
	title=document.getElementById(title)
	$(title).addClass("activated");
  })(jQuery);