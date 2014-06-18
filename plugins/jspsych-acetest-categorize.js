/** 
 * jspsych plugin for ace lab test
 * Yosef Skolnick
 * updated June 2014
 * 
 * display an image or HTML object and then give corrective feedback based on the subject's response
 *
 * parameters:
 *      stimuli: array of stimuli. array elements can be paths to images or strings of HTML.
 *		choices: array of possible choices to click on
 * 		numchoices: The number of choices to set up
 *      correct_text: HTML string to show when correct answer is given.
 *      incorrect_text: HTML string to show when incorrect answer is given.
 *              NOTE: for both of the above, the special string %ANS% can be used. The text_answer associated with 
 *              the trial will be substituted for %ANS%. 
 *      timing_stim: how long to show the stimulus for. -1 will show until response is given.
 *      timing_feedback_duration: how long to show the feedback for.
 *      timing_post_trial: how long to show a blank screen before the next trial.
 *      show_stim_with_feedback: if true, the stimulus will remain on the screen while feedback is given.
 *      is_html: must set to true if the stimulus is HTML code.
 *      force_correct_button_press: if true, then the user must press the correct key after feedback is given.
 *      prompt: HTML string to show when the subject is viewing the stimulus and making a categorization decision.
 *      data: the optional data object
**/

(function($) {
    jsPsych["ace-test-categorize"] = (function() {

        var plugin = {};

        plugin.create = function(params) {
            var trials = [];
            for (var i = 0; i < params.stimuli.length; i++) {
                trials.push({});
                trials[i].type = "ace-test-categorize";
                trials[i].a_path = params.stimuli[i];
				trials[i].ans = params.ans[i]
				trials[i].corrans = params.corrans[i]
				trials[i].numchoices = params.numchoices[0]
                trials[i].correct_text = (typeof params.correct_text === 'undefined') ? "<p class='feedback'>Correct</p>" : params.correct_text;
                trials[i].incorrect_text = (typeof params.incorrect_text === 'undefined') ? "<p class='feedback'>Incorrect</p>" : params.incorrect_text;
                // timing params
                trials[i].timing_stim = params.timing_stim || -1; // default is to show image until response
                trials[i].timing_feedback_duration = params.timing_feedback_duration || 2000;
                trials[i].timing_post_trial = (typeof params.timing_post_trial === 'undefined') ? 1000 : params.timing_post_trial;
                // optional params
                trials[i].show_stim_with_feedback = (typeof params.show_stim_with_feedback === 'undefined') ? true : params.show_stim_with_feedback;
                trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
                trials[i].force_correct_button_press = (typeof params.force_correct_button_press === 'undefined') ? false : params.force_correct_button_press;
                trials[i].prompt = (typeof params.prompt === 'undefined') ? '' : params.prompt;
                trials[i].data = (typeof params.data === 'undefined') ? {} : params.data[i];
            }
            return trials;
        };

        var cat_trial_complete = false;

        plugin.trial = function(display_element, block, trial, part) {
            
            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            trial = jsPsych.normalizeTrialVariables(trial);

            switch (part) {
            case 1:
                // set finish flag
				var count = 0;
                cat_trial_complete = false;


			display_element.append($('<img>', {
				"src": trial.a_path,
				"class": 'jspsych-categorize-stimulus',
				"id": 'jspsych-categorize-stimulus',
				"style": "width:50%",
			}));
			display_element.append('<br>');
			display_element.append(function(){
			for (var j = 0;j<3;j++){
			
				display_element.append($('<img>', {
					"src": trial.ans[j],
					"class": 'jspsych-categorize-imgs',
					"id": 'jspsych-categorize-imgs',
					"style": "width:30%",
				}
				))};
			
			}
			);
			$( ".jspsych-categorize-imgs" ).draggable();


			$( "#dropbox" ).on( "drop", function( event, ui ) {
					var flag = false;
                    var correct = false;
					var anste = ui.draggable[0].src.split('/');
					var ca = trial.corrans.split('/');
					if (anste[anste.length-1] == ca[ca.length-1]){
                        flag = true;
                        correct = true;
                    }
					else {
						score=0;
						document.getElementById("scoree").innerHTML = score;
						flag = true;
						correct = false;                  
					}
                    if (flag) {
                        cat_trial_complete = true;
						score++;
						document.getElementById("scoree").innerHTML = score;
						$("#dropbox").html("Yay");
                        // measure response time
                        var endTime = (new Date()).getTime();
                        var rt = (endTime - startTime);

                        // save data
                        var trial_data = {
                            "trial_type": "acetest-categorize",
                            "trial_index": block.trial_idx,
                            "rt": rt,
                            "correct": correct,
                            "stimulus": trial.a_path,

                        };

                        block.writeData($.extend({}, trial_data, trial.data));

                        // clear function

                        display_element.html('');
                        plugin.trial(display_element, block, trial, part + 1);
                    }
				}
			);
			
            

                // hide image after time if the timing parameter is set
                if (trial.timing_stim > 0) {
                    setTimeout(function() {
                        if (!cat_trial_complete) {
                            $('#jspsych-categorize-stimulus').css('visibility', 'hidden');
                        }
                    }, trial.timing_stim);
                }

                // if prompt is set, show prompt
                if (trial.prompt !== "") {
                    display_element.append(trial.prompt);
                }

                // start measuring RT
                var startTime = (new Date()).getTime();

                // create response function
                // add event listener
				$( "#dropbox" ).droppable({	drop: function(event,ui){}});
                break;
			
			
            case 2:
                // show image during feedback if flag is set
                if (trial.show_stim_with_feedback) {
                    if (!trial.is_html) {
                        // add image to display
                        display_element.append($('<img>', {
                            "src": trial.a_path,
                            "class": 'jspsych-categorize-stimulus',
                            "id": 'jspsych-categorize-stimulus'
                        }));
                    }
                    else {
                        display_element.append($('<div>', {
                            "id": 'jspsych-categorize-stimulus',
                            "class": 'cat',
                            "html": trial.a_path
                        }));
                    }
                }

                // substitute answer in feedback string.
                var atext = "";
                if (block.data[block.trial_idx].correct) {
                    atext = trial.correct_text.replace("%ANS%", trial.text_answer);
                }
                else {
                    atext = trial.incorrect_text.replace("%ANS%", trial.text_answer);
                }

                // show the feedback
                display_element.append(atext);

                // check if force correct button press is set
                if (trial.force_correct_button_press && block.data[block.trial_idx].correct === false) {
                    var resp_func_corr_key = function(e) {
                        if (e.which == trial.key_answer) // correct category
                        {
                            $(document).unbind('keyup', resp_func_corr_key);
                            plugin.trial(display_element, block, trial, part + 1);
                        }
                    };
                    $(document).keyup(resp_func_corr_key);
                }
                else {
                    setTimeout(function() {
                        plugin.trial(display_element, block, trial, part + 1);
                    }, trial.timing_feedback_duration);
                }
                break;
            case 3:
                display_element.html("");
                if(trial.timing_post_trial > 0){
                    setTimeout(function() {
                        block.next();
                    }, trial.timing_post_trial);
                } else {
                    block.next();
                }
                break;
            }
        };

        return plugin;
    })();
})(jQuery);
