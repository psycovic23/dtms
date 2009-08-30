from django.db import models
import datetime

class User(models.Model):
    name = models.CharField(max_length=30)
    email = models.EmailField(max_length=75)
    house_id = models.PositiveIntegerField()
    password = models.CharField(max_length=50)

    def __unicode__(self):
        return self.name

class Tag(models.Model):
    tag_name = models.CharField(max_length=50)

    def __unicode__(self):
        return self.tag_name

    def cat_price(self):
        t = self.item_set.all()
        total_price = 0
        for x in t:
            total_price += x.price
        return [str(self.tag_name), float(total_price)]

# all item_model revisions attach to this. this attaches to item_status
class Item(models.Model):
    # for archiving purposes
    archive_id = models.IntegerField()
    users = models.ManyToManyField(User, through='Item_status')

    # for many to one relationship (tags)
    tag = models.ForeignKey(Tag)
    sub_tag = models.CharField(default='',max_length=40)

    name = models.CharField(max_length=40)
    purch_date = models.DateField(default=datetime.datetime.now())
    date_edited = models.DateTimeField(auto_now_add=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    buyer = models.IntegerField()
    comments = models.CharField(default='',max_length=400)
    house_id = models.IntegerField()
    
    def tag_name(self):
        return self.tag

    def sub_tag_name(self):
        return self.sub_tag

    def __unicode__(self):
        return self.name


# defining many-to-many relationship between User and Item
class Item_status(models.Model):
    user = models.ForeignKey(User)
    item = models.ForeignKey(Item)
    maybe_buying = models.BooleanField() # true means maybe buying, EXCLUDES BUYERS
    date_added = models.DateTimeField(auto_now_add=True)

