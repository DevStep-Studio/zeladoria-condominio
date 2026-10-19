<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class HelpArticle extends Model
{
    public $timestamps = false;

    protected $table = 'help_articles';

    protected $fillable = ['slug', 'title', 'category', 'body', 'tags', 'video_url'];
}
