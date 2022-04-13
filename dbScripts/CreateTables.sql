CREATE TABLE Users (
    UserID int primary key auto_increment,
    UserName varchar(255) not null unique,
    Email varchar(255) not null unique,
    Password varchar(255) not null 
);
Create Table Exercises(
	ExerciseId int primary key auto_increment,
    ExerciseName varchar(255) not null unique
);
Create Table Workouts(
	WorkoutId int primary key auto_increment,
	UserId int not null not null,
    Title varchar(255),
    WorkoutDate datetime,
    public bool not null,
    UserEntered datetime
);
Create Table ExercisesSets(
	ExerSetId int primary key auto_increment,
	WorkoutId int not null,
    ExerciseId int not null
);
Create Table Sets(
	SetId int primary key auto_increment,
    ExerSetId int not null,
    Reps int ,
    Weight int ,
    VideoExist bool
);
Create Table friendships(
	Friend1Id int not null,
    Friend2Id int not null
);
Create Table invites(
	InviterId int not null,
    InvitedId int not null
);
Create Table comments(
	CommentId int primary key auto_increment,
    CommentorId int not null,
    WorkoutId int not null,
    content VarChar(255),
    PostDate datetime
);
Create Table Messages(
MessageId int primary key auto_increment,
SenderId int not null,
reciverId int not null,
content varchar(255)
);