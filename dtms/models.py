from django.db import models
import datetime

class User(models.Model):
	name = models.CharField(max_length=30)
	email = models.EmailField(max_length=75)
	house_id = models.PositiveIntegerField()
	password = models.CharField(max_length=50)

	def __unicode__(self):
		return self.name

class Item_model(models.Model):
	name = models.CharField(max_length=40)
	purch_date = models.DateField(default=datetime.datetime.now())
	date_edited = models.DateTimeField(auto_now_add=True)
	price = models.DecimalField(max_digits=6, decimal_places=2)
	buyer = models.IntegerField()
	users = models.ManyToManyField(User, through='Item_status')
	comments = models.CharField(default='',max_length=400)
	tags = models.CharField(default='',max_length=100)
	house_id = models.IntegerField()

	# for archiving purposes
	archive_id = models.IntegerField()

# defining many-to-many relationship between User and Item
class Item_status(models.Model):
	user = models.ForeignKey(User)
	item = models.ForeignKey(Item_model)
	maybe_buying = models.BooleanField() # true means maybe buying, EXCLUDES BUYERS
	date_added = models.DateTimeField(auto_now_add=True)

