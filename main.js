'use strict';

// Các phím tắt đến DOM Elements.
var messageForm = document.getElementById('message-form'); 
var messageInput = document.getElementById('new-post-message'); 
var titleInput = document.getElementById('new-post-title');

var signInButton = document.getElementById('sign-in-button'); 
var signOutButton = document.getElementById('sign-out-button');

var splashPage = document.getElementById('page-splash'); 
var addPost = document.getElementById('add-post'); 
var addButton = document.getElementById('add');

var recentPostsSection = document.getElementById('recent-posts-list'); 
var userPostsSection = document.getElementById('user-posts-list');
var topUserPostsSection = document.getElementById('top-user-posts-list'); 

var recentMenuButton = document.getElementById('menu-recent');
var myPostsMenuButton = document.getElementById('menu-my-posts');
var myTopPostsMenuButton = document.getElementById('menu-my-top-posts'); 

var listeningFirebaseRefs = [];

//Lichngo on the mic: Cái chỗ này để show cái div ra khi click vào hiển thị, 
//Vì mấy btn khác mình click vào nó ko ra gì nên ko đặt cái hide vào mấy event đó đc, nào bạn connect đc DB cần mình sp thì mình giúp sau
// Hiện tại click vào btn Hiển thị để show và click thêm lần nữa để giấu nó đi
// const targetDiv = document.getElementById("chart-dien-nuoc");
// const btnHienThi = document.getElementById("btn-hien-thi");
// btnHienThi.onclick = function () {
//   if (targetDiv.style.display !== "none") {
//     targetDiv.style.display = "none";
//   } else {
//     targetDiv.style.display = "block";
//   }
// };



/**
 * Lưu một bài đăng mới vào Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, title, body) { var postData = {

// Một bài viết.
author: username=('IOT đồ án'),

uid: uid,

body: body,

title: title,

starCount: 0,

authorPic: picture

};

// Lấy chìa khóa cho một bài mới.
var newPostKey = firebase.database().ref().child('posts').push().key; 

// Viết dữ liệu của bài đăng mới đồng thời trong danh sách bài đăng và danh sách bài đăng của người dùng.
var updates = {};
updates['/posts/' + newPostKey] = postData; 
updates['/user-posts/' + uid + '/' + newPostKey] = postData; 
return firebase.database().ref().update(updates);

}

// [END write_fan_out]



/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
function toggleStar(postRef, uid) {
  postRef.transaction(function(post) {
    if (post) {
      if (post.stars && post.stars[uid]) {
        post.starCount--;
        post.stars[uid] = null;
      } else {
        post.starCount++;
        if (!post.stars) {
          post.stars = {};
        }
        post.stars[uid] = true;
      }
    }
    return post;
  });
}
// [END post_stars_transaction]








/**
 * Tạo một yếu tố bài.
 */

function createPostElement(postId, title, text, author, authorId, authorPic) { var uid = firebase.auth().currentUser.uid;

var html =


'<div class="post post-' + postId + 

' mdl-cell mdl-cell--12-col ' + 

'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +

'<div class="mdl-card mdl-shadow--2dp">' +

'<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' + 

'<h4 class="mdl-card__title-text"></h4>' +

'</div>' +

'<div class="header">' +

'<div>' +

'<div class="avatar"></div>' +

'<div class="username mdl-color-text--black"></div>' + 

'</div>' +

'</div>' +



'<span class="star">' +
    '<div class="not-starred material-icons">star_border</div>' +
    '<div class="starred material-icons">star</div>' +
    '</span>' +



'<div class="text"></div>' +

'</div>' +

'</div>';


// Tạo phần tử DOM từ HTML.

var div = document.createElement('div');

div.innerHTML = html;

var postElement = div.firstChild;

// Set values.
postElement.getElementsByClassName('text')[0].innerText = text; 
postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title; 
postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous'; 
postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +(authorPic || './silhouette.jpg') + '")';

return postElement;

}




/**
 * Bắt đầu nghe bài viết mới và điền danh sách bài viết.
 */


function startDatabaseQueries() {

var myUserId = firebase.auth().currentUser.uid;
var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
var topUserPostsRef = firebase.database().ref('notice').limitToLast(100); 
var userPostsRef = firebase.database().ref('user-posts/' + myUserId);


var fetchPosts = function(postsRef, sectionElement) { postsRef.on('child_added', function(data) {
var author = data.val().author || 'Anonymous';
var containerElement = sectionElement.getElementsByClassName('posts-container')[0]; 
containerElement.insertBefore(
createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),containerElement.firstChild);

});

postsRef.on('child_changed', function(data) {
var containerElement = sectionElement.getElementsByClassName('posts-container')[0]; 
var postElement = containerElement.getElementsByClassName('post-' + data.key)[0]; 
postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title; 
postElement.getElementsByClassName('username')[0].innerText = data.val().author; 
postElement.getElementsByClassName('text')[0].innerText = data.val().body;


});

postsRef.on('child_removed', function(data) {
var containerElement = sectionElement.getElementsByClassName('posts-container')[0]; 
var post = containerElement.getElementsByClassName('post-' + data.key)[0]; 
post.parentElement.removeChild(post);

});

};


// Tìm nạp và hiển thị tất cả các bài viết của từng phần.
fetchPosts(topUserPostsRef, topUserPostsSection); 
fetchPosts(recentPostsRef, recentPostsSection); 
fetchPosts(userPostsRef, userPostsSection);

// Theo dõi tất cả các ref của Firebase mà chúng tôi đang nghe.
listeningFirebaseRefs.push(topUserPostsRef);
listeningFirebaseRefs.push(recentPostsRef);
listeningFirebaseRefs.push(userPostsRef);

}


/**
 * Ghi dữ liệu của người dùng vào cơ sở dữ liệu.
 */
// [START basic_write]

function writeUserData(userId, name, email, imageUrl) { firebase.database().ref('users/' + userId).set({

username: name,

email: email,

profile_picture : imageUrl

});

}

// [END basic_write]

/**
 * Dọn dẹp giao diện người dùng và xóa tất cả người nghe Firebase.
 */
function cleanupUi() {

topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

// Dừng tất cả những người nghe Firebase hiện đang nghe.
listeningFirebaseRefs.forEach(function(ref) {

ref.off();

});

listeningFirebaseRefs = [];

}

/**
* ID của Người dùng hiện đang đăng nhập. Chúng tôi theo dõi điều này để phát hiện các sự kiện thay đổi trạng thái Auth chỉ
  * làm mới mã thông báo theo chương trình nhưng không thay đổi trạng thái Người dùng.
 */
var currentUID;

var admin = "LzgTUHy9gcYU7pOdFmch2U8AXgG2"; var n = 1;






/**
  * Kích hoạt mỗi khi có thay đổi trong trạng thái xác thực Firebase (nghĩa là người dùng đã đăng nhập hoặc người dùng đã đăng xuất).
  */

function onAuthStateChanged(user) {

if (user && currentUID === user.uid) {


return;

}


cleanupUi();

if (user) {

currentUID = user.uid;

if(currentUID === admin)

{

n=1;

}

else

{

n=0;

}

splashPage.style.display = 'none';

writeUserData(user.uid, user.displayName, user.email, user.photoURL); startDatabaseQueries();

} else {

currentUID = null;

// Hiển thị trang giật gân nơi bạn có thể đăng nhập.

splashPage.style.display = '';

}

}




/**
* Tạo một bài viết mới cho người dùng hiện tại.
 */

function newPostForCurrentUser(title, text) {

var userId = firebase.auth().currentUser.uid;

return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) { 
	var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';


// [START_EXCLUDE]
return writeNewPost(firebase.auth().currentUser.uid, username, firebase.auth().currentUser.photoURL,title, text);
// [END_EXCLUDE]
});
// [END single_value_read]
}




/**
* Hiển thị phần tử đã cho và thay đổi kiểu dáng của nút đã cho.
 */

function showSection(sectionElement, buttonElement) { 
recentPostsSection.style.display = 'none'; 
userPostsSection.style.display = 'none'; 
topUserPostsSection.style.display = 'none';
addPost.style.display = 'none'; 
myTopPostsMenuButton.classList.remove('is-active');
recentMenuButton.classList.remove('is-active'); 
myPostsMenuButton.classList.remove('is-active');


if (sectionElement) {

sectionElement.style.display = 'block';

}

if (buttonElement) {

buttonElement.classList.add('is-active');

}

}





// Ràng buộc khi tải.
window.addEventListener('load', function() { 
// Nút Bind Đăng nhập.
	signInButton.addEventListener('click', function() {
var provider = new firebase.auth.GoogleAuthProvider(); 
firebase.auth().signInWithPopup(provider);
});

// Nút Bind Đăng xuất.
signOutButton.addEventListener('click', function() { firebase.auth().signOut();

});


// Nghe thay đổi trạng thái auth

firebase.auth().onAuthStateChanged(onAuthStateChanged); 

// Lưu tin nhắn trên mẫu gửi 1.
messageForm.onsubmit = function(e) {
e.preventDefault();

var text = messageInput.value;

var title = titleInput.value;

if (text && title) {

newPostForCurrentUser(title, text).then(function() {

myPostsMenuButton.click();

});

messageInput.value = '';

titleInput.value = '';

}

};


recentMenuButton.onclick = function() {

if(n==1)

{

showSection(recentPostsSection, recentMenuButton);

}

};




myPostsMenuButton.onclick = function() { showSection(userPostsSection, myPostsMenuButton);
};

myTopPostsMenuButton.onclick = function() { showSection(topUserPostsSection, myTopPostsMenuButton);

};


addButton.onclick = function() {

showSection(addPost);


messageInput.value = '';

titleInput.value = '';

};


myPostsMenuButton.onclick;

}, false);
