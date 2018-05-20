var root = angular.module("root", ['ngRoute']);
var dash = angular.module("dash", ['ngRoute']);
var globalUserName = "";
var globalUserLocation = null;

root.controller("loginController", ["$scope", "$http",function( $scope, $http ) {
	$scope.invalid_user = false;
	$('#LoginBtn').click(function (e) {
		var email = $('#InputEmail').val();
		var pass = $('#InputPassword').val();

		if(email != "" && pass != "") {
			$scope.checkLoogin(email, pass);
		}
	});


    $('#RegisterBtn').click(function (e) {
        var name = $('#exampleInputName').val();
        var email = $('#exampleInputEmail1').val();
        var pass = $('#exampleInputPassword1').val();
        var passConf = $('#exampleConfirmPassword').val();

        if (name != "" && email != "" && pass != "" &&
            passConf != "") {
            var obj = {
                email: email,
                name: name,
                password: pass,
                passwordConf: passConf
            };
            $scope.registerAction(obj);
        }
    });



	$('#registerAcc').click(function (e) {
		window.location.href = '/register';
	});

    $scope.registerAction = function(obj) {
        var data = obj;
        data = JSON.stringify(data);
        $.ajax
          ({
            type: "POST",
            url: "/register",
            dataType: 'json',
            async: true,
            data: data,
            success: function (res){
                if (res.err == true) {
                    alert("Passwords don't match");
                } else {
                    window.location.href = '/index';
                }
            }
        });
    };

	$scope.checkLoogin = function(email, pass, cb) {
		var data2 = {
            logemail: email,
            logpassword: pass
        };
        data2 = JSON.stringify(data2);
        $.ajax
          ({
            type: "POST",
            url: "/",
            dataType: 'json',
            async: true,
            data: data2,
            success: function (res){
                if (res.err == true) {
                    $scope.$apply(function () {
                        $scope.invalid_user = true;
                    });
                } else {
                    window.location.href = '/index';
                }
            }
        });

	}

}]);

dash.controller("dashboardController", ["$scope", "$http", function( $scope, $http ) {
    $scope.entities = null;
    $scope.is_admin = false;
    $scope.updateProfSucc = false;
    $scope.updateProfFail = false;
    $scope.data = {}

    $('#add-friend-btn2').click(function (e) {
        console.log("here")
        var grp_title = $('#NameEven2').val()
        $http.get('/newGroup?groupTitle=' + grp_title).then((result)=>{
            if (result.data.error)
                alert(result.data.error);
            else
                console.log(result.data);
                alert("Created new group");
                window.location.reload()
        });

    });

    $('#add-friend-btn').click(function (e) {
        var friend_email = $('#NameEvent').val()
        $http.get('/getUserFromEmail?emailf=' + friend_email).then((result)=>{
            if (result.data.error)
                alert(result.data.error);
            else
                console.log(result.data);
                $http.post('/addFriend?friend_id=' + result.data._id).then((result) => {
                   if (result.data.error)
                       alert(result.data.error);
                   else
                       alert("Added new friend");
                   window.location.reload()
                });
        });

    });

    $scope.getLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition($scope.showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    $scope.showPosition = function(position) {
        console.log(position.coords);
        if (position) {
            $http.post('/updateLocation?lat=' + position.coords.latitude + '&long=' + position.coords.longitude).then(result => {
                if (result.data.err)
                    console.log("Error while updating location");
                else
                    console.log("User location updated!");
            })
        }
    }

    $(document).ready(function () {

         $scope.getLocation();

         $http.get('/getProfilePic').then(function (result) {
            if (result) {
                $('#profimg').attr({src: result.data.user.profilePic});
            } else {
                $('#profimg').attr({src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Koala_climbing_tree.jpg/360px-Koala_climbing_tree.jpg"});
            }
         });

         $http.get('/getCloseFriends').then(function (result) {
            // console.log(result);
            if (result && result.data && result.data.close_friends) {
                var friends = result.data.close_friends;
                for (var i = 0; i < friends.length; i++) {
                    $('#tbody-friends-sugg').append("<tr><td> " + friends[i].name + " (" + friends[i].email + ")" +"</td></tr>");
                }
             }
         })



        $("#table-friends").on("click", "td", function(e) {
            /*TODO aici schimbam id-ul parametrul paginii cu chat
               cu id-ul conversatiei intre cei 2. Dupa ce adaugam API
               de create grup e lejer.
               Mare atentie: cand 2 persoane vor deveni prieteni, se va crea
               o conversatie automat cu cei 2 participanti*/
            // TODO momentan facem concatenare (mare, mic).

            var fid = $(this).attr('id_friend');
            var convID = "";
            console.log($scope.data._id)
            if (fid > $scope.data._id)
                convID = fid + $scope.data._id;
            else
                convID =  $scope.data._id + fid;

            var win = window.open('http://localhost:3003/chatView?convID=' + fid, '_blank');
            win.focus()
        });


        $("#table-groups").on("click", "td", function(e) {
            /*TODO aici schimbam id-ul parametrul paginii cu chat
               cu id-ul conversatiei intre cei 2. Dupa ce adaugam API
               de create grup e lejer.
               Mare atentie: cand 2 persoane vor deveni prieteni, se va crea
               o conversatie automat cu cei 2 participanti*/
            // TODO momentan facem concatenare (mare, mic).

            var fid = $(this).attr('id_group');
            var convID = "";
            console.log($scope.data._id)
            convID = fid;

            var win = window.open('http://localhost:3003/chatView?convID=' + convID, '_blank');
            win.focus()
        });


        $http.get('/isAdmin').then(function (res) {
            var isAdmin = res.data;
            if (isAdmin) {
                $scope.is_admin = true;
            } else {
                $scope.is_admin = false;
            }
        })

        $http.get('/getUserName').then(function (result) {
            $('#titleBox').text("JoinChat 💬   " + result.data);
        })

        $http.get('/userInfo').then(function(res) {
            if (!res)
                return;

            var _data = res.data;
            $scope.data = _data;
            $('#name').text("Name: " + _data.name);
            $('#email').text("Email: " + _data.email);
            console.log(_data);
            var j = 0;
            for (j =0; j < _data.friends.length; j++)
            {
                $http.get('/userInfo?id=' + _data.friends[j]["_id"]).then((res) => {
                    for (var i =0 ; i < _data.friends.length; i++)
                    {
                        if (_data.friends[i]._id == res.data._id)
                        {
                            $('#tbody-friends').append("<tr><td class='td-friend' id_friend='" +  _data.friends[i]["group"] + "'><a href=\"#\">" + res.data.name +"</a></td></tr>");
                        }
                    }

                    console.log(res.data)
                });
            }

            $http.get('/getUserGroups').then((res) => {
               var data = res.data;
               for (var i = 0; i < data.length; i++)
               {
                   $('#tbody-groups').append("<tr><td class='td-group' id_group='" + data[i]._id+ "'><a href='#'>" + data[i].title +"</a>" +
                       "</td></tr>");
               }
            });
        });

        $('#ProfileBtn').click(function (e) {
            var url = $('#ProfileURL').val()
            if (!(url == "" || url == null)) {
                //console.log(url);
                $http.post('/updateProfilePic?url=' + url).then(function (result) {
                    console.log(result);
                    location.reload();
                })
            }
        })
    })
}]);
