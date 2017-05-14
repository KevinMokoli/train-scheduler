// Initialize Firebase
  var config = {
    apiKey: "AIzaSyCKwhVw9d992C-DBBT1QT_yi9VLg74lIMg",
    authDomain: "train-scheduler-db28c.firebaseapp.com",
    databaseURL: "https://train-scheduler-db28c.firebaseio.com",
    projectId: "train-scheduler-db28c",
    storageBucket: "train-scheduler-db28c.appspot.com",
    messagingSenderId: "696254965642"
  };
  
firebase.initializeApp(config);
// Getting reference for firebase database
var database = firebase.database();

var githubProvider = new firebase.auth.GithubAuthProvider();

// var googleProvider = new firebase.auth.GoogleAuthProvider();

var allTrains = [];

var interval;

var userName, profilePicSrc;

var user = null;

var trainMessageArray = [];

var trainMessageIterator = 0;

$("#signOut, #welcomeName, #userPic").hide();

$("#signInWithGithub").on("click", function(){

	firebase.auth().signInWithPopup(githubProvider)

	.then(function(result) {
	  	// This gives you a GitHub Access Token. You can use it to access the GitHub API.
		var token = result.credential.accessToken;
		// The signed-in user info.
		user = result.user;

		$("#newTrainAdditionPanel").show();
		$(".signedIn").show();

		$("#userName").html(user.displayName);
		$("#userPic").attr('src', user.photoURL);

		$("#signOut, #welcomeName, #userPic").show();
		$("#signInWithGoogle, #signInWithGithub").hide();

	  // ...
	}).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		// The email of the user's account used.
		var email = error.email;
		// The firebase.auth.AuthCredential type that was used.
		var credential = error.credential;
		console.log("Error - " + errorCode + "  " + errorMessage + "  " + email + "  " + credential);

	});
});

$("#signOut").on("click", function() {
	firebase.auth().signOut()

	.then(function() {
		console.log(firebase.auth().currentUser);
		$("#newTrainAdditionPanel").hide();
		$(".signedIn").hide();
	  	// alert("Signed out successfully.");
	  	$(".modal-body").html("Signed out successfully");
	  	$('#notificationModal').modal('show');
	},function(error) {
	  	console.log("Error signing out.");
	});

	$("#userName").html("");
	$("#userPic").attr('src', "");
	$("#signOut, #welcomeName, #userPic").hide();
	$("#signInWithGoogle, #signInWithGithub").show();
	user = null;
})

$('#notificationModal').on('shown.bs.modal', function() {
    $('#myInput').focus()
});

$("#firstTrainTime").on("blur", function() {
	if($("#firstTrainTime").val() !== "") {
		var regExp = new RegExp($("#firstTrainTime").attr('pattern'));
		var value = $("#firstTrainTime").val().trim();
		if(!regExp.test(value)) {
			$(this).addClass("remove-default").addClass("wrong-format");
		}else {
			$(this).removeClass("remove-default").removeClass("wrong-format");
		}
	}
	else{
		$(this).removeClass("remove-default").removeClass("wrong-format");
	}
});

// On button click to add new train
$("#addTrain").on("click", function(event) {
	event.preventDefault();

	var regExp = new RegExp($("#firstTrainTime").attr('pattern'));
	var value = $("#firstTrainTime").val().trim();
	if(!regExp.test(value)) {
		$("#firstTrainTime").toggleClass("wrong-format");
		$(".modal-body").html("Wrong format entered. Enter HH:mm military format.");
		$('#notificationModal').modal('show');
		return;
	}else {

		// Capture input values in variables
		var trainName = $("#trainName").val().trim();
		var destination = $("#destination").val().trim();
		var startTime = $("#firstTrainTime").val().trim();
		var frequency = $("#frequency").val().trim();

		// Creating an object with variables
		var newTrain = {
			trainName: trainName,
			destination: destination,
			startTime: startTime,
			frequency: frequency,
			updatedTime: ""
		};

		// Adding information to database
		database.ref().push(newTrain);

		// Inform user of new train addition
		$(".modal-body").html("New train successfully added");
		$('#notificationModal').modal('show');
		// Clear all input fields
		$("#trainName").val("");
		$("#destination").val("");
		$("#firstTrainTime").val("");
		$("#frequency").val("");

	}

});

function updateUIWithData(childSnapshotVal,key) {

		var trainName = childSnapshotVal.trainName;
		var destination = childSnapshotVal.destination;
		var frequency = childSnapshotVal.frequency;
		// Ensuring that the start time has not passed by
		var startTime = childSnapshotVal.startTime;


		var startTimeCalculated = moment(startTime, "HH:mm").subtract(1, "years");

		// // Getting current time
		var currentTime = moment();

		// // Total minutes = current time - start time
		var totalMinutesPast = moment().diff(moment(startTimeCalculated), "minutes");

		var moduloRemainder = totalMinutesPast % frequency;

		var minutesToArrival = frequency - moduloRemainder;

		var nextArrivalTime = moment().add(minutesToArrival, "minutes");

		if(childSnapshotVal.updatedTime !== "") {
			nextArrivalTime = moment(childSnapshotVal.updatedTime, "HH:mm");
			minutesToArrival = Math.abs(moment().diff(moment(nextArrivalTime), "minutes"));
		}

		$("#tableBody").append("<tr id='"+ key +"'><td><input type='text' class='name' value='" + trainName + "'></td><td><input type='text' class='destination' value='" + destination + "'></td><td>" + frequency + "</td><td><input type='text' class='arrivalTime' value='" + moment(nextArrivalTime).format("hh:mm A") + "'></td><td>" + minutesToArrival + "</td><td><button type='submit' class='signedIn edit btn btn-danger'><i class='fa fa-pencil' aria-hidden='true'></i>Edit</button><button type='submit' class='update btn btn-danger'><i class='fa fa-check' aria-hidden='true'></i>Update</button><button type='submit' class='remove btn btn-danger'><i class='fa fa-trash' aria-hidden='true'></i>Remove</button><button class='undoEditClick btn btn-danger'><i class='fa fa-undo' aria-hidden='true'></i></button></td></tr>");
		$("td> input").attr('disabled', true).addClass('non-editable');
		$(".update, .remove, .undoEditClick").hide();
		trainMessageArray.push("<span>"+ trainName + " bound for " + destination + " will be arriving at " + moment(nextArrivalTime).format("hh:mm A") + " on Platform number " + Math.floor(Math.random()*4 + 1) + ". </span>");
		  if (user !== null) {
			    // Show hidden buttons/ panel
			    $("#newTrainAdditionPanel").show();
				$(".signedIn").show();
		  	} else {
			    // Hide buttons/ panel
			    $("#newTrainAdditionPanel").hide();
				$(".signedIn").hide();
		  	}
}

$("#tableBody").on("click", ".update", function() {
	var currentKey = $(this).parent().parent().attr('id');
	var updatedTrainName = $(this).parent().parent().find("td> .name").val();
	var updatedDestination = $(this).parent().parent().find("td> .destination").val();
	var updatedArrivalTime = $(this).parent().parent().find("td> .arrivalTime").val();

	var dataUpdates = {
		trainName: updatedTrainName,
		destination: updatedDestination,
		// startTime: startTime,
		updatedTime: updatedArrivalTime
	}

	database.ref("/"+currentKey).update(dataUpdates);

});

database.ref().on("value", function(snapshot) {

	var json_data = snapshot.val();
	allTrains = [];
	for(var i in json_data) {
		allTrains.push([i, json_data [i]]);
	}

	$("#tableBody").empty();
	 allTrains.forEach(function(snapshotData) {
    	updateUIWithData(snapshotData[1],snapshotData[0]);
	 });

	 interval = setInterval(updateUIEveryMinute, 60000);

});

$("#tableBody").on("click", ".remove", function() {
	var currentKey = $(this).parent().parent().attr('id');

	database.ref("/"+currentKey).remove();

});

$("#tableBody").on("click", ".edit", function() {
	var currentArrivalTime = $(this).parent().parent().find("td> .arrivalTime").val();
	$(this).parent().parent().find("td> input").attr('disabled', false).removeClass('non-editable');
	formattedToDisplayTime = moment(currentArrivalTime, "HH:mm A").format("HH:mm");
	$(this).parent().parent().find("td> .arrivalTime").attr('value', formattedToDisplayTime);
	$(this).parent().parent().find("td> .arrivalTime").attr('type','time');
	$(this).hide();
	$(this).parent().parent().find(".update, .remove, .undoEditClick").show();
	clearInterval(interval);

});

$("#tableBody").on("click", ".undoEditClick", function() {
	updateUIEveryMinute();
});


function updateUIEveryMinute() {
	$("#tableBody").empty();
	allTrains.forEach(function(snapshotData) {
    	updateUIWithData(snapshotData[1],snapshotData[0]);
	});
}
generateMarquee();

// Function to call marquee text every 20 secs
function generateMarquee() {
	$("#trainMessage").html(trainMessageArray[0]);
	setInterval(generateMarqeeText, 20000);
}

// Function that generates marquee text
function generateMarqeeText() {
	$("#trainMessage").html(trainMessageArray[trainMessageIterator]);
	if(trainMessageIterator !== trainMessageArray.length) {
		++trainMessageIterator;
	}else {
		trainMessageIterator = 0;
	}
}
