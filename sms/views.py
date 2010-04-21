# Create your views here.
from django.http import HttpResponse

from dtms.models import User, Tag, newItem, Buyer_item, User_item

import datetime, decimal
from django.utils import simplejson as json
import pdb
import logging
LOG_FILENAME = '/home/vhwang/log'
logging.basicConfig(filename=LOG_FILENAME,level=logging.DEBUG)
# not found house, user, missing data
def process_sms(request, sms_string):
    logging.debug(sms_string)
    words = sms_string.split('+')
    buyer = None
    user = None
    price = None
    item_description = None

    # find house name
    for i in range(len(words)):
        if User.objects.filter(house_name__exact=words[i]):
            house_name = words[i]
            del words[i]
            break

    users = User.objects.filter(house_name__exact=house_name)
    house_id = users[0].house_id
    logging.debug(house_id)
    names = [p.name for p in users]

    # found first name
    for i in range(len(words)):
        if words[i] in names:
            buyer = User.objects.get(name=words[i],
                                     house_id=house_id)
            del words[i]
            break

    # found second name
    for i in range(len(words)):
        if words[i] in names:
            user = User.objects.get(name=words[i],
                                    house_id=house_id)
            del words[i]
            break

    # get price
    for i in range(len(words)):
        try:
            price = float(words[i])
        except:
            pass

    # find everything after 'for'
    try:
        for_index = words.index('for')
        item_description = words[for_index+1:]
    except:
        pass

    # set current time as purch date
    today =  datetime.datetime.today()

    # set tag
    try:
        tag = Tag.objects.get(name='uncategorized',
                              house_id=house_id)
    except:
        tag = Tag(name='uncategorized', house_id=house_id)
        tag.save()


    
    # generate the buyer and user price data
    buyer_array = {}
    buyer_array[buyer.id] = [price, buyer.name]

    user_array = {}
    user_array[user.id] = [price, user.name]

    # fix name
    if item_description:
        name = (' ').join(item_description)
    else:
        name = 'phone entry'

    ref_item = newItem(
        name = name,
        price = decimal.Decimal(str(round(float(price), 2))),
        archive_id = 0,
        house_id = house_id,
        tag = tag,
        comments = "",
        purch_date = today,
        users_a = json.dumps(user_array), 
        buyers_a = json.dumps(buyer_array)
    )

    ref_item.save()
    b_link = Buyer_item(user=buyer, item=ref_item)
    b_link.save()

    u_link = User_item(user=user, item=ref_item)
    u_link.save()

    return HttpResponse('success')

