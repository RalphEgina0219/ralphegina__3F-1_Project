# LaundryFlow API: PHP 8.3-FPM for local development (see ../../../docs/DOCKER.md).
# The code is not copied in: compose.yaml bind-mounts laravel-backend/ at /var/www/html, so edits
# show at once. vendor/ lives in a named volume, filled by the entrypoint with composer install.
FROM php:8.3-fpm-bookworm

# The host user's ids, so files written to storage/ and bootstrap/cache keep sane owners.
ARG UID=1000
ARG GID=1000

# Extensions the project needs. mbstring, pdo, ctype, curl, openssl and fileinfo are built in.
# git and unzip let Composer install packages; libfcgi-bin gives cgi-fcgi for the health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libicu-dev libzip-dev libfcgi-bin \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath intl zip opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-laundryflow.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/zz-laundryflow.conf
COPY docker/php/entrypoint.sh /usr/local/bin/laundryflow-entrypoint

# A Windows checkout may have given the script CRLF line endings: strip them.
RUN sed -i 's/\r$//' /usr/local/bin/laundryflow-entrypoint \
    && chmod +x /usr/local/bin/laundryflow-entrypoint

# The app user. The vendor volume starts as a copy of /var/www/html/vendor, so it is theirs too.
RUN (getent group "${GID}" || groupadd --gid "${GID}" laundryflow) \
    && useradd --uid "${UID}" --gid "${GID}" --create-home --shell /bin/bash laundryflow \
    && mkdir -p /var/www/html/vendor /home/laundryflow/.composer/cache \
    && chown -R "${UID}:${GID}" /var/www/html /home/laundryflow

# No time limit on Composer scripts: `composer test` runs the whole suite (several minutes).
ENV COMPOSER_HOME=/home/laundryflow/.composer \
    COMPOSER_NO_INTERACTION=1 \
    COMPOSER_PROCESS_TIMEOUT=0

WORKDIR /var/www/html
USER laundryflow

EXPOSE 9000
ENTRYPOINT ["laundryflow-entrypoint"]
CMD ["php-fpm", "--nodaemonize"]
