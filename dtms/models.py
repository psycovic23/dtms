from django.db import models
from django.utils import simplejson as json
import operator
import pdb
import datetime
import decimal
from django.db.models import Q, Sum
from django.contrib import admin

def decimal_parse(s): 
    return decimal.Decimal(str(round(float(s), 2)))

class User(models.Model):
    name        = models.CharField(max_length=30)
    email       = models.EmailField(max_length=75)
    house_id    = models.PositiveIntegerField()
    house_name  = models.CharField(max_length=30)
    password    = models.CharField(max_length=50)

    def __unicode__(self):
        return self.name

class Item_list:

    def __init__(self, item_list = None, house_id = None, user_id = None,
                 archive_id = None, houseMode = 0):
        self.item_list = item_list

        self.house_id = house_id
        self.uid = int(user_id)
        self.archive_id = archive_id
        self.gen_balancing_transactions()
        self.houseMode = houseMode

    def ret_list(self):
        if self.houseMode=='1':
            return self.item_list.order_by('-purch_date', '-id')
        else:
            # find anything that you bought or used and how much you paid for it
            u = User.objects.select_related().get(id=self.uid)
            items = self.item_list.filter((Q(user_item__user__exact=u) |
                                      Q(buyer_item__user__exact=u))).distinct().order_by('-purch_date',
                                                                                         '-id')

            for t in items:
                u_o = t.users_o()
                b_o = t.buyers_o()

                if u_o.has_key(str(u.id)):
                    t.price = u_o[str(u.id)][0]
                else:
                    t.price = -1 * b_o[str(u.id)][0]
            return items


    def barGraphData(self, houseMode=0):
        x = {}
        new_list = self.item_list
        
        if houseMode == 0:
            new_list = self.item_list.filter(users__id__exact=self.uid)

        if new_list:
            display_str = new_list.order_by('purch_date')[0].purch_date.strftime('%b %d, %y')
            display_str = display_str + ' - ' + new_list.order_by('-purch_date')[0].purch_date.strftime('%b %d, %y')
            for i in new_list:
                if str(i.tag) not in x:
                    x[str(i.tag)] = 0

                if houseMode == 0:
                    x[str(i.tag)] += i.users_o()[str(self.uid)][0]
                else:
                    x[str(i.tag)] += i.price
            
            categories = []
            series = []
            for (k,v) in x.iteritems():
                categories.append(k)
                series.append(float(v))

            if len(categories) == 1:
                categories.append(' ')
                series.append(float(0))
            return {'categories': categories, 'series': series, 'display_date':
               display_str}
        else:
            return {'categories': [], 'series': [], 'display_date': 'you have no items for this month!'}
        
    def gen_balancing_transactions(self):
        balances = {}
        self.will_pay = {}
        self.expects = {}
        self.sign = {}

        users = User.objects.filter(house_id=self.house_id)
        balance_sum = {}
        for x in users:
            balance_sum[x.id] = decimal.Decimal('0')

        for x in self.item_list:
            for (k,v) in x.users_o().items():
                balance_sum[int(k)] -= v[0]
            for (k,v) in x.buyers_o().items():
                balance_sum[int(k)] += v[0]

        # transactions
        transactions = [] 
        self.ind_balance = balance_sum[self.uid]

        balances = balance_sum.copy()

        if self.ind_balance >= 0:
            self.ind_sign = 'p'
        else:
            self.ind_sign = 'n'
    
        # while array is non zero
        counter = 1
        while len([p for p in balance_sum if balance_sum[p] != 0]) != 0:
            counter += 1
            if counter > 15:
                raise Exception, "Infinite loop in creating transaction"
    
            # owes = [key, amount]
            owes = min([(val, key) for (key, val) in balance_sum.items()])
            expects = max([(val, key) for (key, val) in balance_sum.items()])
            owes = list(owes)
            owes.reverse()
            expects = list(expects)
            expects.reverse()
            
            if (owes[1] + expects[1]) < 0:
                amount = expects[1]
            else:
                amount = owes[1] * -1
   
            transactions.append([owes[0], expects[0], amount,
                                 User.objects.get(id=owes[0]).name,
                                 User.objects.get(id=expects[0]).name])
            balance_sum[expects[0]] -= amount
            balance_sum[owes[0]] += amount

        self.ind_will_pay = [p for p in transactions if p[0] == self.uid]
        self.ind_expects = [p for p in transactions if p[1] == self.uid]
        
        self.names_and_balances = {}
        for u, v in zip(users, sorted(balances.items())):
            self.names_and_balances[u.name] = v[1]

        self.names_and_balances = self.names_and_balances.items()
        self.transactions = transactions

class Tag(models.Model):
    name    = models.CharField(max_length=50)
    house_id = models.PositiveIntegerField()

    def __unicode__(self):
        return self.name

class newItem(models.Model):

    name        = models.CharField(max_length=40)
    price       = models.DecimalField(max_digits=6, decimal_places=2)
    archive_id  = models.IntegerField()
    house_id    = models.IntegerField()

    tag         = models.ForeignKey(Tag)
    sub_tag     = models.CharField(default='',max_length=40)
    comments    = models.CharField(default='',max_length=400)
    purch_date  = models.DateField(default=datetime.datetime.now())
    date_edited = models.DateTimeField(auto_now_add=True)

    users_a     = models.CharField(max_length=200)
    users       = models.ManyToManyField(User, through='User_item',
                                         related_name='users')
    buyers_a    = models.CharField(max_length=200)
    buyers      = models.ManyToManyField(User, through='Buyer_item',
                                         related_name='buyers')
    
    class Meta:
        ordering = ['-purch_date']

    def buyers_o(self):
        return json.loads(self.buyers_a, parse_float=decimal_parse)

    def users_o(self):
        return json.loads(self.users_a, parse_float=decimal_parse)

    def buyerName(self):
        u_o = self.users_o()
        b_o = self.buyers_o()

        if len(b_o) != 1:
            return 'multiple'
        else:
            #(Pdb) b_o.items()
            #[(u'14', [4.5899999999999999, u'susan'])]
            return b_o.items()[0][1][1]

    def __unicode__(self):
        return self.name

# shopping lists
class SL(models.Model):
    name        = models.CharField(max_length=40)
    house_id    = models.IntegerField()

# individual shopping list items
class SL_item(models.Model):
    name        = models.CharField(max_length=40)
    added_by    = models.ForeignKey(User)
    marked      = models.IntegerField()
    list        = models.ForeignKey(SL)


class User_item(models.Model):
    user        = models.ForeignKey(User)
    item        = models.ForeignKey(newItem)

    def __unicode__(self):
        return str([self.user, self.item])

class Buyer_item(models.Model):
    user        = models.ForeignKey(User)
    item        = models.ForeignKey(newItem)

    def __unicode__(self):
        return [self.name, self.item]
