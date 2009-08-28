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
        t = self.item_node_set.all()
        total_price = 0
        for x in t:
            total_price += x.latest_revision().price
        return [str(self.tag_name), float(total_price)]

# all item_model revisions attach to this. this attaches to item_status
class Item_node(models.Model):
    # for archiving purposes
    archive_id = models.IntegerField()
    users = models.ManyToManyField(User, through='Item_status')

    # for many to one relationship (tags)
    tag = models.ForeignKey(Tag)
    sub_tag = models.CharField(default='',max_length=40)

    def latest_revision(self):
        return self.item_model_set.all()[0]

    def __unicode__(self):
        return self.item_model_set.all()[0].name



class Item_model(models.Model):

    name = models.CharField(max_length=40)
    purch_date = models.DateField(default=datetime.datetime.now())
    date_edited = models.DateTimeField(auto_now_add=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    buyer = models.IntegerField()
    comments = models.CharField(default='',max_length=400)
    house_id = models.IntegerField()
    node_id = models.IntegerField()
    
    # for many-to-one relationship (item revisions)
    item_head = models.ForeignKey(Item_node)

    def tag_name(self):
        return self.item_head.tag

    def sub_tag_name(self):
        return self.item_head.sub_tag

    def __unicode__(self):
        return self.name

    class Meta:
        ordering = ['-date_edited']


# defining many-to-many relationship between User and Item_node
class Item_status(models.Model):
    user = models.ForeignKey(User)
    item = models.ForeignKey(Item_node)
    maybe_buying = models.BooleanField() # true means maybe buying, EXCLUDES BUYERS
    date_added = models.DateTimeField(auto_now_add=True)


